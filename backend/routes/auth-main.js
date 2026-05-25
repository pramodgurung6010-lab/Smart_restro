const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { login, getUsers, createUser, updateUser, deleteUser, changePassword, getProfile, updateProfile, forgotPassword, resetPassword, toggleUserStatus } = require('../controllers/authController');

router.post('/login', login);
router.get('/users', authenticateToken, requireAdmin, getUsers);
router.post('/register', authenticateToken, requireAdmin, createUser);
router.put('/users/:id', authenticateToken, requireAdmin, updateUser);
router.patch('/users/:id/toggle-status', authenticateToken, requireAdmin, toggleUserStatus);
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);
router.put('/change-password', authenticateToken, changePassword);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
