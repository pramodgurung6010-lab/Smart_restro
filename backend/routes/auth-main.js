const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { login, getUsers, createUser, updateUser, deleteUser, changePassword, getProfile, updateProfile } = require('../controllers/authController');

router.post('/login', login);
router.get('/users', authenticateToken, requireAdmin, getUsers);
router.post('/register', authenticateToken, requireAdmin, createUser);
router.put('/users/:id', authenticateToken, requireAdmin, updateUser);
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);
router.put('/change-password', authenticateToken, changePassword);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
