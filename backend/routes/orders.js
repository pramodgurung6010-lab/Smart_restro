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

// POST /orders/update-item-status - Update individual item status
// Using POST instead of PATCH for better compatibility
router.post('/update-item-status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { orderId, itemId, status } = req.body;
    console.log('🔧 Item status update request:', { orderId, itemId, status });

    const validStatuses = ['PENDING', 'PREPARING', 'READY'];
    if (!validStatuses.includes(status)) {
      console.log('❌ Invalid status:', status);
      return res.status(400).json({ message: 'Invalid item status' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.log('❌ Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find and update the specific item
    const item = order.items.id(itemId);
    if (!item) {
      console.log('❌ Item not found:', itemId);
      return res.status(404).json({ message: 'Item not found in order' });
    }

    console.log('✅ Updating item status from', item.status, 'to', status);
    item.status = status;
    
    // Update overall order status based on items
    const allItemStatuses = order.items.map(i => i.status);
    if (allItemStatuses.every(s => s === 'READY')) {
      order.status = 'READY';
    } else if (allItemStatuses.some(s => s === 'PREPARING' || s === 'READY')) {
      order.status = 'PREPARING';
    } else {
      order.status = 'PENDING';
    }

    await order.save();
    console.log('✅ Item status updated successfully');

    const updatedOrder = await Order.findById(orderId)
      .populate('waiter', 'name username')
      .populate('items.menuItem', 'name category');

    res.status(200).json({
      message: `Item status updated to ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update item status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

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
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean()
      .exec();
    
    // Manually populate waiter and menuItem to preserve all fields
    const Menu = require('../models/Menu');
    const User = require('../models/User');
    
    for (let order of orders) {
      // Populate waiter
      if (order.waiter) {
        const waiter = await User.findById(order.waiter).select('name username').lean();
        order.waiter = waiter;
      }
      
      // Populate menuItem for each item and ensure status exists
      for (let item of order.items) {
        if (item.menuItem) {
          const menuItem = await Menu.findById(item.menuItem).select('name category').lean();
          item.menuItem = menuItem;
        }
        // Ensure status field exists (for old orders that might not have it)
        if (!item.status) {
          item.status = 'PENDING';
        }
      }
    }

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
      .lean()
      .exec();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Manually populate waiter and menuItem to preserve all fields
    const Menu = require('../models/Menu');
    const User = require('../models/User');
    
    if (order.waiter) {
      const waiter = await User.findById(order.waiter).select('name username').lean();
      order.waiter = waiter;
    }
    
    for (let item of order.items) {
      if (item.menuItem) {
        const menuItem = await Menu.findById(item.menuItem).select('name category price').lean();
        item.menuItem = menuItem;
      }
      if (!item.status) {
        item.status = 'PENDING';
      }
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
        specialInstructions: item.specialInstructions || '',
        status: 'PENDING'
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

// PATCH /orders/:id/status - Update order or item status
router.patch('/:id/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, itemId } = req.body;
    
    console.log('🔧 Status update request:', { orderId: id, itemId, status });

    const order = await Order.findById(id);
    if (!order) {
      console.log('❌ Order not found:', id);
      return res.status(404).json({ message: 'Order not found' });
    }

    // If itemId is provided, update individual item status
    if (itemId) {
      const validItemStatuses = ['PENDING', 'PREPARING', 'READY'];
      if (!validItemStatuses.includes(status)) {
        console.log('❌ Invalid item status:', status);
        return res.status(400).json({ message: 'Invalid item status' });
      }

      const item = order.items.id(itemId);
      if (!item) {
        console.log('❌ Item not found:', itemId);
        return res.status(404).json({ message: 'Item not found in order' });
      }

      console.log('✅ Updating item status from', item.status, 'to', status);
      item.status = status;
      
      // Update overall order status based on all items
      const allItemStatuses = order.items.map(i => i.status);
      if (allItemStatuses.every(s => s === 'READY')) {
        order.status = 'READY';
      } else if (allItemStatuses.some(s => s === 'PREPARING' || s === 'READY')) {
        order.status = 'PREPARING';
      } else {
        order.status = 'PENDING';
      }
    } else {
      // Update order-level status
      const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Record actual prep time when order is ready
      if (status === 'READY' && order.status === 'PREPARING') {
        const prepStartTime = order.updatedAt || order.createdAt;
        const prepTime = Math.round((new Date() - prepStartTime) / (1000 * 60)); // in minutes
        order.actualPrepTime = prepTime;
      }

      order.status = status;
    }

    await order.save();
    console.log('✅ Status updated successfully');

    const updatedOrder = await Order.findById(id)
      .populate('waiter', 'name username')
      .populate('items.menuItem', 'name category');

    res.status(200).json({
      message: `Status updated to ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

// ============= BILLING ENDPOINTS =============

// POST /orders/:id/bill/generate - Generate bill for an order
router.post('/:id/bill/generate', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('waiter', 'name username')
      .populate('items.menuItem', 'name category price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is ready for billing
    if (order.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot generate bill for cancelled order' });
    }

    // Generate bill details
    const billDetails = {
      orderId: order.orderId,
      orderDate: order.createdAt,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName || order.waiter?.name,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        amount: item.price * item.quantity
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount || 0,
      total: order.total,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      isPaid: order.isPaid
    };

    res.status(200).json({
      message: 'Bill generated successfully',
      bill: billDetails
    });
  } catch (error) {
    console.error('Generate bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /orders/:id/bill/pay - Process payment for an order
router.post('/:id/bill/pay', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, amountPaid, discount } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate payment method
    const validPaymentMethods = ['CASH', 'CARD', 'UPI', 'ONLINE'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Check if already paid
    if (order.isPaid) {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    // Apply discount if provided
    if (discount && discount > 0) {
      order.discount = discount;
      order.total = order.subtotal + order.tax - discount;
    }

    // Validate amount paid
    if (amountPaid < order.total) {
      return res.status(400).json({ 
        message: 'Insufficient payment amount',
        required: order.total,
        received: amountPaid
      });
    }

    // Update order with payment details
    order.paymentMethod = paymentMethod;
    order.paymentStatus = 'PAID';
    order.isPaid = true;
    order.status = 'SERVED'; // Mark order as served when paid

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('waiter', 'name username')
      .populate('items.menuItem', 'name category');

    res.status(200).json({
      message: 'Payment processed successfully',
      order: updatedOrder,
      change: amountPaid - order.total
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /orders/:id/bill/split - Split bill for an order
router.post('/:id/bill/split', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { splitCount, splitType } = req.body; // splitType: 'equal' or 'custom'

    const order = await Order.findById(id)
      .populate('items.menuItem', 'name category price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: 'Cannot split paid order' });
    }

    let splitBills = [];

    if (splitType === 'equal') {
      // Split equally
      const amountPerPerson = Math.round((order.total / splitCount) * 100) / 100;
      
      for (let i = 0; i < splitCount; i++) {
        splitBills.push({
          splitNumber: i + 1,
          amount: i === splitCount - 1 
            ? order.total - (amountPerPerson * (splitCount - 1)) // Last person pays remainder
            : amountPerPerson,
          items: 'Shared equally'
        });
      }
    }

    res.status(200).json({
      message: 'Bill split calculated',
      orderId: order.orderId,
      totalAmount: order.total,
      splitCount,
      splitBills
    });
  } catch (error) {
    console.error('Split bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /orders/billing/unpaid - Get all unpaid orders
router.get('/billing/unpaid', authenticateToken, requireStaff, async (req, res) => {
  try {
    const unpaidOrders = await Order.find({ 
      isPaid: false,
      status: { $ne: 'CANCELLED' }
    })
      .populate('waiter', 'name username')
      .sort({ createdAt: -1 })
      .lean();

    // Manually populate and ensure all fields
    const Menu = require('../models/Menu');
    const User = require('../models/User');
    
    for (let order of unpaidOrders) {
      if (order.waiter) {
        const waiter = await User.findById(order.waiter).select('name username').lean();
        order.waiter = waiter;
      }
      
      for (let item of order.items) {
        if (item.menuItem) {
          const menuItem = await Menu.findById(item.menuItem).select('name category').lean();
          item.menuItem = menuItem;
        }
        if (!item.status) {
          item.status = 'PENDING';
        }
      }
    }

    res.status(200).json({
      count: unpaidOrders.length,
      orders: unpaidOrders
    });
  } catch (error) {
    console.error('Get unpaid orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /orders/:id/bill/discount - Apply discount to order
router.post('/:id/bill/discount', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { discount, discountType } = req.body; // discountType: 'amount' or 'percentage'

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: 'Cannot apply discount to paid order' });
    }

    let discountAmount = 0;

    if (discountType === 'percentage') {
      if (discount < 0 || discount > 100) {
        return res.status(400).json({ message: 'Invalid discount percentage' });
      }
      discountAmount = Math.round((order.subtotal * discount / 100) * 100) / 100;
    } else {
      if (discount < 0 || discount > order.subtotal) {
        return res.status(400).json({ message: 'Invalid discount amount' });
      }
      discountAmount = discount;
    }

    order.discount = discountAmount;
    order.total = order.subtotal + order.tax - discountAmount;

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('waiter', 'name username')
      .populate('items.menuItem', 'name category');

    res.status(200).json({
      message: 'Discount applied successfully',
      order: updatedOrder,
      discountApplied: discountAmount
    });
  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;