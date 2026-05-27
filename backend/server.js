const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add request logging — only log non-GET requests to reduce polling noise
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  }
  next();
});

// Import User model
const User = require('./models/User');

// Import auth routes
const authRoutes = require('./routes/auth-main');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const tableRoutes = require('./routes/tables');
const Table = require('./models/Table');

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

// Use menu routes
app.use('/api/menu', menuRoutes);

// Use order routes
app.use('/api/orders', orderRoutes);

// Use table routes
app.use('/api/tables', tableRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create default admin user if it doesn't exist
    const adminExists = await User.findOne({ username: 'admin100', role: 'ADMIN' });
    
    if (!adminExists) {
      const defaultAdmin = new User({
        username: 'admin100',
        email: 'admin@smartrestro.com',
        password: 'admin123',
        role: 'ADMIN'
      });
      
      await defaultAdmin.save();
      console.log('✅ Default admin user created (admin100)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Seed initial tables if none exist
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      const initialTables = [
        { tableId: 't1',  number: '01', capacity: 2 },
        { tableId: 't2',  number: '02', capacity: 2 },
        { tableId: 't3',  number: '03', capacity: 2 },
        { tableId: 't4',  number: '04', capacity: 2 },
        { tableId: 't5',  number: '05', capacity: 2 },
        { tableId: 't6',  number: '06', capacity: 4 },
        { tableId: 't7',  number: '07', capacity: 4 },
        { tableId: 't8',  number: '08', capacity: 4 },
        { tableId: 't9',  number: '09', capacity: 4 },
        { tableId: 't10', number: '10', capacity: 4 },
        { tableId: 't11', number: '11', capacity: 8 },
        { tableId: 't12', number: '12', capacity: 8 },
        { tableId: 't13', number: '13', capacity: 10 },
        { tableId: 't14', number: '14', capacity: 4 },
        { tableId: 't15', number: '15', capacity: 4 },
      ];
      await Table.insertMany(initialTables);
      console.log('✅ Initial tables seeded (15 tables)');
    } else {
      console.log(`ℹ️  Tables already exist (${tableCount})`);
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
  console.log('- GET /api/menu');
  console.log('- POST /api/menu');
  console.log('- PUT /api/menu/:id');
  console.log('- DELETE /api/menu/:id');
  console.log('- GET /api/orders');
  console.log('- POST /api/orders');
  console.log('- PUT /api/orders/:id');
  console.log('- DELETE /api/orders/:id');
});