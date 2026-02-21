const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  specialInstructions: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PREPARING', 'READY'],
    default: 'PENDING'
  }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true
  },
  tableId: {
    type: String,
    required: true
  },
  tableNumber: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentStatus: {
    type: String,
    enum: ['UNPAID', 'PAID', 'REFUNDED'],
    default: 'UNPAID'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'UPI', 'ONLINE'],
    default: null
  },
  waiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  waiterName: {
    type: String
  },
  actualPrepTime: {
    type: Number // in minutes
  },
  isPaid: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
orderSchema.index({ orderId: 1 });
orderSchema.index({ tableId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ waiter: 1 });

module.exports = mongoose.model('Order', orderSchema);