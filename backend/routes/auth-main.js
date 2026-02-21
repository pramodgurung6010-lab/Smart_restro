const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateSecurePassword } = require('../utils/passwordGenerator');
const { sendCredentialsEmail } = require('../services/emailService');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Require Admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// POST /login - Login user
router.post('/login', async (req, res) => {
  console.log('Login attempt:', req.body);
  
  const { username, password, role } = req.body;

  try {
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') },
      role 
    });
    
    console.log('User found:', user ? user.username : 'No user');
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    const isMatch = await user.matchPassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    console.log('Login successful for:', user.username);

    res.status(200).json({
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /users - Get all users (Admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /register - Create new user (Admin only)
router.post('/register', authenticateToken, requireAdmin, async (req, res) => {
  console.log('Register attempt:', req.body);
  
  const { username, email, role, name, phoneNumber } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.username.toLowerCase() === username.toLowerCase() 
          ? 'Username already exists' 
          : 'Email already exists' 
      });
    }

    // Generate secure password
    const generatedPassword = generateSecurePassword();

    // Create new user
    const newUser = new User({
      username,
      email,
      password: generatedPassword, // Will be hashed by pre-save middleware
      role,
      name,
      phoneNumber,
      isActive: true
    });

    await newUser.save();
    console.log('✅ User created successfully:', username);

    // Try to send email with credentials
    try {
      const emailResult = await sendCredentialsEmail(email, username, generatedPassword, role);
      
      if (emailResult.success) {
        console.log('📧 Credentials email sent successfully');
        
        res.status(201).json({
          message: 'User created successfully and credentials sent via email',
          user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            name: newUser.name,
            phoneNumber: newUser.phoneNumber,
            isActive: newUser.isActive,
            createdAt: newUser.createdAt
          }
        });
      } else {
        console.error('📧 Email sending failed:', emailResult.error);
        
        // Return success with manual credentials
        res.status(201).json({
          message: 'User created successfully but email could not be sent',
          user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            name: newUser.name,
            phoneNumber: newUser.phoneNumber,
            isActive: newUser.isActive,
            createdAt: newUser.createdAt
          },
          manualCredentials: {
            username: username,
            password: generatedPassword,
            role: role
          }
        });
      }
    } catch (emailError) {
      console.error('📧 Email sending failed:', emailError.message);
      
      // Return success with manual credentials
      res.status(201).json({
        message: 'User created successfully but email could not be sent',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name,
          phoneNumber: newUser.phoneNumber,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt
        },
        manualCredentials: {
          username: username,
          password: generatedPassword,
          role: role
        }
      });
    }

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /users/:id - Update user (Admin only)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, email, role, name, phoneNumber, isActive } = req.body;

  try {
    // Prevent admin from deactivating themselves
    if (req.user.id === id && isActive === false) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    // Check if username or email already exists (excluding current user)
    const existingUser = await User.findOne({
      _id: { $ne: id },
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.username.toLowerCase() === username.toLowerCase() 
          ? 'Username already exists' 
          : 'Email already exists' 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, email, role, name, phoneNumber, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /users/:id - Delete user (Admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /change-password - Change own password
router.put('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    console.log('✅ Password changed successfully for:', user.username);
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /profile - Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /profile - Update current user profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { name, phoneNumber, email } = req.body;

  try {
    // Check if email already exists (excluding current user)
    if (email) {
      const existingUser = await User.findOne({
        _id: { $ne: req.user.id },
        email: { $regex: new RegExp(`^${email}$`, 'i') }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, phoneNumber, email },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
