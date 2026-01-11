const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Import User model
const User = require('./models/User');

// Import auth routes
const authRoutes = require('./routes/auth-main');

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Test POST route
app.post('/test-post', (req, res) => {
  console.log('Test POST received:', req.body);
  res.json({ message: 'POST is working!', received: req.body });
});

// Use auth routes
app.use('/api/auth', authRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create default admin user if it doesn't exist
    const adminExists = await User.findOne({ username: 'admin', role: 'ADMIN' });
    
    if (!adminExists) {
      const defaultAdmin = new User({
        username: 'admin',
        email: 'admin@smartrestro.com',
        password: 'admin123',
        role: 'ADMIN'
      });
      
      await defaultAdmin.save();
      console.log('✅ Default admin user created: admin/admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  })
  .catch((err) => console.log(err));

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- GET /test');
  console.log('- POST /api/auth/login');
  console.log('- GET /api/auth/users');
  console.log('- POST /api/auth/register');
  console.log('- PUT /api/auth/users/:id');
  console.log('- DELETE /api/auth/users/:id');
});