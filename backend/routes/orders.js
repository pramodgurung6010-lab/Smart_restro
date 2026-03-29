const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAll, getOne, create, update, updateStatus, updateItemStatus,
  updatePayment, cancel, getStats, generateBill, processPayment,
  splitBill, getUnpaidOrders, applyDiscount, mergeTables
} = require('../controllers/ordersController');

const requireStaff = (req, res, next) => {
  if (!['ADMIN', 'WAITER', 'KITCHEN'].includes(req.user.role))
    return res.status(403).json({ message: 'Staff access required' });
  next();
};

router.post('/update-item-status', authenticateToken, requireStaff, updateItemStatus);
router.post('/merge-tables', authenticateToken, requireStaff, mergeTables);
router.get('/stats/summary', authenticateToken, requireStaff, getStats);
router.get('/billing/unpaid', authenticateToken, requireStaff, getUnpaidOrders);

router.get('/', authenticateToken, requireStaff, getAll);
router.get('/:id', authenticateToken, requireStaff, getOne);
router.post('/', authenticateToken, requireStaff, create);
router.put('/:id', authenticateToken, requireStaff, update);
router.patch('/:id/status', authenticateToken, requireStaff, updateStatus);
router.patch('/:id/payment', authenticateToken, requireStaff, updatePayment);
router.delete('/:id', authenticateToken, requireStaff, cancel);

router.post('/:id/bill/generate', authenticateToken, requireStaff, generateBill);
router.post('/:id/bill/pay', authenticateToken, requireStaff, processPayment);
router.post('/:id/bill/split', authenticateToken, requireStaff, splitBill);
router.post('/:id/bill/discount', authenticateToken, requireStaff, applyDiscount);

module.exports = router;
