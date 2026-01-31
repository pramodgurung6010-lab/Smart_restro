const express = require('express');
const Order = require('../models/Order');
const Menu = require('../models/Menu');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Require Admin or Waiter role
const requireStaff = (req, res, next) => {
  if (!['ADMIN', 'WAITER', 'KITCHEN'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Staff access required' });
  }
  next();
};

// GET /orders - Get all orders with filtering
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { 
      status, 
      tableId, 
      waiter, 
      paymentStatus, 
      startDate, 
      endDate,
      limit = 50,
      page = 1 
    } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by table
    if (tableId) {
      query.tableId = tableId;
    }

    // Filter by waiter
    if (waiter) {
      query.waiter = waiter;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .populate('waiter', 'name username')
      .populate('items.menuItem', 'name category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        hasNext: skip + orders.length < totalOrders,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /orders/:id - Get single order
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('waiter', 'name username')
      .populate('items.menuItem', 'name category price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /orders - Create new order
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    console.log('📝 Order creation request received:', req.body);
    
    const {
      tableId,
      tableNumber,
      items
    } = req.body;

    console.log('📋 Extracted data:', { tableId, tableNumber, items: items?.length });

    // Validate required fields
    if (!tableId || !tableNumber || !items || items.length === 0) {
      console.log('❌ Validation failed: missing required fields');
      return res.status(400).json({ message: 'Table ID, table number, and items are required' });
    }

    // Validate and populate menu items
    const orderItems = [];

    for (const item of items) {
      const menuItem = await Menu.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(400).json({ message: `Menu item not found: ${item.menuItemId}` });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({ message: `Menu item not available: ${menuItem.name}` });
      }

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || ''
      });
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax
    const total = Math.round((subtotal + tax) * 100) / 100;

    // Generate order ID
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    const orderId = `ORD${year}${month}${day}${timestamp}`;

    // Create new order
    const newOrder = new Order({
      orderId,
      tableId,
      tableNumber,
      items: orderItems,
      subtotal,
      tax,
      total,
      waiter: req.user._id,
      waiterName: req.user.name || req.user.username,
      status: 'PENDING'
    });

    await newOrder.save();

    // Populate the saved order for response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('waiter', 'name username')
      .populate('items.menuItem', 'name category');

    res.status(201).json({
      message: 'Order created successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /orders/:id - Update order
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating certain fields directly
    delete updateData.orderId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('waiter', 'name username')
     .populate('items.menuItem', 'name category');

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /orders/:id/status - Update order status
router.patch('/:id/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Record actual prep time when order is ready
    if (status === 'READY' && order.status === 'PREPARING') {
      const prepStartTime = order.updatedAt || order.createdAt;
      const prepTime = Math.round((new Date() - prepStartTime) / (1000 * 60)); // in minutes
      order.actualPrepTime = prepTime;
    }

    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('waiter', 'name username')
      .populate('items.menuItem', 'name category');

    res.status(200).json({
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /orders/:id/payment - Update payment status
router.patch('/:id/payment', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod, isPaid } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (paymentStatus) {
      const validPaymentStatuses = ['UNPAID', 'PAID', 'REFUNDED'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
      }
      order.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
      const validPaymentMethods = ['CASH', 'CARD', 'UPI', 'ONLINE'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({ message: 'Invalid payment method' });
      }
      order.paymentMethod = paymentMethod;
    }

    if (isPaid !== undefined) {
      order.isPaid = isPaid;
    }

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('waiter', 'name username')
      .populate('items.menuItem', 'name category');

    res.status(200).json({
      message: 'Payment status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /orders/:id - Cancel/Delete order
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow cancellation if order is not served or paid
    if (order.status === 'SERVED' || order.isPaid) {
      return res.status(400).json({ message: 'Cannot cancel served or paid orders' });
    }

    // Mark as cancelled instead of deleting
    order.status = 'CANCELLED';
    await order.save();

    res.status(200).json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /orders/stats/summary - Get order statistics
router.get('/stats/summary', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const totalOrders = await Order.countDocuments(dateFilter);
    const activeOrders = await Order.countDocuments({ 
      ...dateFilter, 
      status: { $in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } 
    });
    const completedOrders = await Order.countDocuments({ 
      ...dateFilter, 
      status: 'SERVED' 
    });
    const cancelledOrders = await Order.countDocuments({ 
      ...dateFilter, 
      status: 'CANCELLED' 
    });

    const revenueData = await Order.aggregate([
      { $match: { ...dateFilter, isPaid: true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' }
        }
      }
    ]);

    const statusBreakdown = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const topWaiters = await Order.aggregate([
      { $match: { ...dateFilter, status: 'SERVED' } },
      {
        $group: {
          _id: '$waiter',
          waiterName: { $first: '$waiterName' },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      totalOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      revenue: revenueData[0] || { totalRevenue: 0, avgOrderValue: 0 },
      statusBreakdown,
      topWaiters
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;