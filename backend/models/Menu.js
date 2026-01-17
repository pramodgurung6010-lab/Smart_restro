const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Starters', 'Main', 'Dessert', 'Beverage']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    default: 15,
    min: 1
  }
}, {
  timestamps: true
});

// Index for better search performance
menuSchema.index({ name: 'text', description: 'text' });
menuSchema.index({ category: 1, isAvailable: 1 });

module.exports = mongoose.model('Menu', menuSchema);