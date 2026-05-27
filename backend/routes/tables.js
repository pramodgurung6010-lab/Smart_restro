const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const { authenticateToken } = require('../middleware/auth');

// GET /api/tables — get all tables
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tables = await Table.find().sort({ number: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/tables/:tableId/status — update a single table's fields
router.patch('/:tableId/status', authenticateToken, async (req, res) => {
  try {
    const { tableId, ...fields } = req.body;
    // Accept any field sent in the body
    const table = await Table.findOneAndUpdate(
      { tableId: req.params.tableId },
      { ...fields },
      { new: true }
    );
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json(table);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tables/bulk-update — update multiple tables at once (merge/split/unmerge)
router.post('/bulk-update', authenticateToken, async (req, res) => {
  try {
    const { updates } = req.body; // array of { tableId, ...fields }
    const results = await Promise.all(
      updates.map(({ tableId, ...fields }) =>
        Table.findOneAndUpdate({ tableId }, fields, { new: true, upsert: true })
      )
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tables/:tableId — delete a split sub-table
router.delete('/:tableId', authenticateToken, async (req, res) => {
  try {
    await Table.findOneAndDelete({ tableId: req.params.tableId });
    res.json({ message: 'Table deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
