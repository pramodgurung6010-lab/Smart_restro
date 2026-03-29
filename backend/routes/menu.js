const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getAll, getOne, create, update, toggleAvailability, remove } = require('../controllers/menuController');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', authenticateToken, requireAdmin, create);
router.put('/:id', authenticateToken, requireAdmin, update);
router.patch('/:id/availability', authenticateToken, requireAdmin, toggleAvailability);
router.delete('/:id', authenticateToken, requireAdmin, remove);

module.exports = router;
