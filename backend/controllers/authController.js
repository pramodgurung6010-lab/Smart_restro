const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateSecurePassword } = require('../utils/passwordGenerator');
const { sendCredentialsEmail } = require('../services/emailService');

const login = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
      role
    });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(400).json({ message: 'Account is deactivated' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({ id: user._id, username: user.username, name: user.name, email: user.email, role: user.role, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createUser = async (req, res) => {
  const { username, email, role, name, phoneNumber } = req.body;
  try {
    const existingUser = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.username.toLowerCase() === username.toLowerCase()
          ? 'Username already exists' : 'Email already exists'
      });
    }

    const generatedPassword = generateSecurePassword();
    const newUser = new User({ username, email, password: generatedPassword, role, name, phoneNumber, isActive: true });
    await newUser.save();

    const userPayload = {
      id: newUser._id, username: newUser.username, email: newUser.email,
      role: newUser.role, name: newUser.name, phoneNumber: newUser.phoneNumber,
      isActive: newUser.isActive, createdAt: newUser.createdAt
    };

    try {
      const emailResult = await sendCredentialsEmail(email, username, generatedPassword, role);
      if (emailResult.success) {
        return res.status(201).json({ message: 'User created and credentials sent via email', user: userPayload });
      }
    } catch (e) { /* fall through */ }

    res.status(201).json({
      message: 'User created but email could not be sent',
      user: userPayload,
      manualCredentials: { username, password: generatedPassword, role }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, role, name, phoneNumber, isActive } = req.body;
  try {
    if (req.user.id === id && isActive === false)
      return res.status(400).json({ message: 'Cannot deactivate your own account' });

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
          ? 'Username already exists' : 'Email already exists'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id, { username, email, role, name, phoneNumber, isActive }, { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.id === id) return res.status(400).json({ message: 'Cannot delete your own account' });
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const { name, phoneNumber, email } = req.body;
  try {
    if (email) {
      const existingUser = await User.findOne({
        _id: { $ne: req.user.id },
        email: { $regex: new RegExp(`^${email}$`, 'i') }
      });
      if (existingUser) return res.status(400).json({ message: 'Email already exists' });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, { name, phoneNumber, email }, { new: true, runValidators: true }
    ).select('-password');
    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, getUsers, createUser, updateUser, deleteUser, changePassword, getProfile, updateProfile };
