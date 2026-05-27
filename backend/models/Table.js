const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableId: {
    type: String,
    required: true,
    unique: true  // e.g. 't1', 't2', ...
  },
  number: {
    type: String,
    required: true  // e.g. '01', '02', ...
  },
  capacity: {
    type: Number,
    required: true
  },
  originalCapacity: {
    type: Number
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MERGED'],
    default: 'AVAILABLE'
  },
  manualStatus: {
    type: Boolean,
    default: false
  },
  currentOrderId: {
    type: String,
    default: null
  },
  // Merge support
  isMerged: {
    type: Boolean,
    default: false
  },
  mergedWith: {
    type: [String],
    default: []
  },
  masterTableId: {
    type: String,
    default: null
  },
  // Split support
  isSplit: {
    type: Boolean,
    default: false
  },
  parentId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Table', tableSchema);
