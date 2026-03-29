const Order = require('../models/Order');
const Menu = require('../models/Menu');
const User = require('../models/User');

// Helper: populate orders manually
const populateOrder = async (order) => {
  if (order.waiter) {
    const waiter = await User.findById(order.waiter).select('name username').lean();
    order.waiter = waiter;
  }
  for (let item of order.items) {
    if (item.menuItem) {
      const menuItem = await Menu.findById(item.menuItem).select('name category price').lean();
      item.menuItem = menuItem;
    }
    if (!item.status) item.status = 'PENDING';
  }
  return order;
};

const getAll = async (req, res) => {
  try {
    const { status, tableId, waiter, paymentStatus, startDate, endDate, limit = 50, page = 1 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (tableId) query.tableId = tableId;
    if (waiter) query.waiter = waiter;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip).lean().exec();
    for (let order of orders) await populateOrder(order);

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
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getOne = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean().exec();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await populateOrder(order);
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { tableId, tableNumber, items } = req.body;
    if (!tableId || !tableNumber || !items || items.length === 0)
      return res.status(400).json({ message: 'Table ID, table number, and items are required' });

    const orderItems = [];
    for (const item of items) {
      const menuItem = await Menu.findById(item.menuItemId);
      if (!menuItem) return res.status(400).json({ message: `Menu item not found: ${item.menuItemId}` });
      if (!menuItem.isAvailable) return res.status(400).json({ message: `Menu item not available: ${menuItem.name}` });
      orderItems.push({
        menuItem: menuItem._id, name: menuItem.name, price: menuItem.price,
        quantity: item.quantity, specialInstructions: item.specialInstructions || '', status: 'PENDING'
      });
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const now = new Date();
    const orderId = `ORD${now.getFullYear().toString().slice(-2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${now.getTime().toString().slice(-6)}`;

    const newOrder = new Order({
      orderId, tableId, tableNumber, items: orderItems, subtotal, tax, total,
      waiter: req.user._id, waiterName: req.user.name || req.user.username, status: 'PENDING'
    });
    await newOrder.save();

    const populatedOrder = await Order.findById(newOrder._id)
      .populate('waiter', 'name username')
      .populate('items.menuItem', 'name category');
    res.status(201).json({ message: 'Order created successfully', order: populatedOrder });
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json({ message: 'Validation error', details: Object.values(err.errors).map(e => e.message) });
    res.status(500).json({ message: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.orderId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (Array.isArray(updateData.items) && updateData.items.length > 0) {
      const orderItems = [];
      for (const item of updateData.items) {
        const menuItem = await Menu.findById(item.menuItemId);
        if (!menuItem) return res.status(400).json({ message: `Menu item not found: ${item.menuItemId}` });
        if (!menuItem.isAvailable) return res.status(400).json({ message: `Menu item not available: ${menuItem.name}` });
        orderItems.push({
          menuItem: menuItem._id, name: menuItem.name, price: menuItem.price,
          quantity: item.quantity, specialInstructions: item.specialInstructions || '',
          status: item.status || 'PENDING'
        });
      }
      const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      updateData.items = orderItems;
      updateData.subtotal = subtotal;
      updateData.tax = Math.round(subtotal * 0.05 * 100) / 100;
      updateData.total = Math.round((subtotal + updateData.tax) * 100) / 100;
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('waiter', 'name username')
      .populate('items.menuItem', 'name category');
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json({ message: 'Validation error', details: Object.values(err.errors).map(e => e.message) });
    res.status(500).json({ message: 'Server error' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, itemId } = req.body;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (itemId) {
      const validItemStatuses = ['PENDING', 'PREPARING', 'READY'];
      if (!validItemStatuses.includes(status)) return res.status(400).json({ message: 'Invalid item status' });
      const item = order.items.id(itemId);
      if (!item) return res.status(404).json({ message: 'Item not found in order' });
      item.status = status;
      const allStatuses = order.items.map(i => i.status);
      if (allStatuses.every(s => s === 'READY')) order.status = 'READY';
      else if (allStatuses.some(s => s === 'PREPARING' || s === 'READY')) order.status = 'PREPARING';
      else order.status = 'PENDING';
    } else {
      const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];
      if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
      if (status === 'READY' && order.status === 'PREPARING') {
        order.actualPrepTime = Math.round((new Date() - (order.updatedAt || order.createdAt)) / 60000);
      }
      order.status = status;
    }

    await order.save();
    const updatedOrder = await Order.findById(id).populate('waiter', 'name username').populate('items.menuItem', 'name category');
    res.status(200).json({ message: `Status updated to ${status}`, order: updatedOrder });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateItemStatus = async (req, res) => {
  try {
    const { orderId, itemId, status } = req.body;
    const validStatuses = ['PENDING', 'PREPARING', 'READY'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid item status' });
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found in order' });
    item.status = status;
    const allStatuses = order.items.map(i => i.status);
    if (allStatuses.every(s => s === 'READY')) order.status = 'READY';
    else if (allStatuses.some(s => s === 'PREPARING' || s === 'READY')) order.status = 'PREPARING';
    else order.status = 'PENDING';
    await order.save();
    const updatedOrder = await Order.findById(orderId).populate('waiter', 'name username').populate('items.menuItem', 'name category');
    res.status(200).json({ message: `Item status updated to ${status}`, order: updatedOrder });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod, isPaid } = req.body;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (paymentStatus) {
      if (!['UNPAID', 'PAID', 'REFUNDED'].includes(paymentStatus)) return res.status(400).json({ message: 'Invalid payment status' });
      order.paymentStatus = paymentStatus;
    }
    if (paymentMethod) {
      if (!['CASH', 'CARD', 'UPI', 'ONLINE'].includes(paymentMethod)) return res.status(400).json({ message: 'Invalid payment method' });
      order.paymentMethod = paymentMethod;
    }
    if (isPaid !== undefined) order.isPaid = isPaid;

    await order.save();
    const updatedOrder = await Order.findById(id).populate('waiter', 'name username').populate('items.menuItem', 'name category');
    res.status(200).json({ message: 'Payment status updated successfully', order: updatedOrder });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const cancel = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'SERVED' || order.isPaid) return res.status(400).json({ message: 'Cannot cancel served or paid orders' });
    order.status = 'CANCELLED';
    await order.save();
    res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const [totalOrders, activeOrders, completedOrders, cancelledOrders, revenueData, statusBreakdown, topWaiters] = await Promise.all([
      Order.countDocuments(dateFilter),
      Order.countDocuments({ ...dateFilter, status: { $in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } }),
      Order.countDocuments({ ...dateFilter, status: 'SERVED' }),
      Order.countDocuments({ ...dateFilter, status: 'CANCELLED' }),
      Order.aggregate([{ $match: { ...dateFilter, isPaid: true } }, { $group: { _id: null, totalRevenue: { $sum: '$total' }, avgOrderValue: { $avg: '$total' } } }]),
      Order.aggregate([{ $match: dateFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { ...dateFilter, status: 'SERVED' } },
        { $group: { _id: '$waiter', waiterName: { $first: '$waiterName' }, orderCount: { $sum: 1 }, totalRevenue: { $sum: '$total' } } },
        { $sort: { orderCount: -1 } }, { $limit: 5 }
      ])
    ]);

    res.status(200).json({
      totalOrders, activeOrders, completedOrders, cancelledOrders,
      revenue: revenueData[0] || { totalRevenue: 0, avgOrderValue: 0 },
      statusBreakdown, topWaiters
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const generateBill = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('waiter', 'name username').populate('items.menuItem', 'name category price');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'CANCELLED') return res.status(400).json({ message: 'Cannot generate bill for cancelled order' });

    res.status(200).json({
      message: 'Bill generated successfully',
      bill: {
        orderId: order.orderId, orderDate: order.createdAt, tableNumber: order.tableNumber,
        waiterName: order.waiterName || order.waiter?.name,
        items: order.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, amount: i.price * i.quantity })),
        subtotal: order.subtotal, tax: order.tax, discount: order.discount || 0, total: order.total,
        paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, isPaid: order.isPaid
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, amountPaid, discount } = req.body;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!['CASH', 'CARD', 'UPI', 'ONLINE'].includes(paymentMethod)) return res.status(400).json({ message: 'Invalid payment method' });
    if (order.isPaid) return res.status(400).json({ message: 'Order is already paid' });

    if (discount && discount > 0) {
      order.discount = discount;
      order.total = order.subtotal + order.tax - discount;
    }
    order.paymentMethod = paymentMethod;
    order.paymentStatus = 'PAID';
    order.isPaid = true;
    order.status = 'SERVED';
    await order.save();

    const updatedOrder = await Order.findById(id).populate('waiter', 'name username').populate('items.menuItem', 'name category');
    res.status(200).json({ message: 'Payment processed successfully', order: updatedOrder, change: amountPaid - order.total });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const splitBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { splitCount, splitType } = req.body;
    const order = await Order.findById(id).populate('items.menuItem', 'name category price');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.isPaid) return res.status(400).json({ message: 'Cannot split paid order' });

    let splitBills = [];
    if (splitType === 'equal') {
      const amountPerPerson = Math.round((order.total / splitCount) * 100) / 100;
      for (let i = 0; i < splitCount; i++) {
        splitBills.push({
          splitNumber: i + 1,
          amount: i === splitCount - 1 ? order.total - amountPerPerson * (splitCount - 1) : amountPerPerson,
          items: 'Shared equally'
        });
      }
    }
    res.status(200).json({ message: 'Bill split calculated', orderId: order.orderId, totalAmount: order.total, splitCount, splitBills });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUnpaidOrders = async (req, res) => {
  try {
    const unpaidOrders = await Order.find({ isPaid: false, status: { $ne: 'CANCELLED' } })
      .populate('waiter', 'name username').sort({ createdAt: -1 }).lean();
    for (let order of unpaidOrders) await populateOrder(order);
    res.status(200).json({ count: unpaidOrders.length, orders: unpaidOrders });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const applyDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { discount, discountType } = req.body;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.isPaid) return res.status(400).json({ message: 'Cannot apply discount to paid order' });

    let discountAmount = 0;
    if (discountType === 'percentage') {
      if (discount < 0 || discount > 100) return res.status(400).json({ message: 'Invalid discount percentage' });
      discountAmount = Math.round(order.subtotal * discount / 100 * 100) / 100;
    } else {
      if (discount < 0 || discount > order.subtotal) return res.status(400).json({ message: 'Invalid discount amount' });
      discountAmount = discount;
    }
    order.discount = discountAmount;
    order.total = order.subtotal + order.tax - discountAmount;
    await order.save();

    const updatedOrder = await Order.findById(id).populate('waiter', 'name username').populate('items.menuItem', 'name category');
    res.status(200).json({ message: 'Discount applied successfully', order: updatedOrder, discountApplied: discountAmount });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const mergeTables = async (req, res) => {
  try {
    const { masterTableId, masterTableNumber, slaveTableIds } = req.body;
    if (!masterTableId || !slaveTableIds || slaveTableIds.length === 0)
      return res.status(400).json({ message: 'masterTableId and slaveTableIds are required' });

    const masterOrder = await Order.findOne({ tableId: masterTableId, status: { $nin: ['SERVED', 'CANCELLED'] }, isPaid: false });
    const slaveOrders = await Order.find({ tableId: { $in: slaveTableIds }, status: { $nin: ['SERVED', 'CANCELLED'] }, isPaid: false });

    if (!masterOrder && slaveOrders.length === 0)
      return res.status(200).json({ message: 'No active orders to merge', merged: false });

    if (masterOrder && slaveOrders.length > 0) {
      for (const slaveOrder of slaveOrders) {
        for (const item of slaveOrder.items) {
          const existing = masterOrder.items.find(i => i.menuItem.toString() === item.menuItem.toString());
          if (existing) existing.quantity += item.quantity;
          else masterOrder.items.push({ menuItem: item.menuItem, name: item.name, price: item.price, quantity: item.quantity, specialInstructions: item.specialInstructions || '', status: item.status || 'PENDING' });
        }
        slaveOrder.status = 'CANCELLED';
        await slaveOrder.save();
      }
      const subtotal = masterOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      masterOrder.subtotal = subtotal;
      masterOrder.tax = Math.round(subtotal * 0.05 * 100) / 100;
      masterOrder.total = Math.round((masterOrder.subtotal + masterOrder.tax) * 100) / 100;
      await masterOrder.save();
      return res.status(200).json({ message: 'Orders merged successfully', merged: true, order: masterOrder });
    }

    if (!masterOrder && slaveOrders.length > 0) {
      const [first, ...rest] = slaveOrders;
      first.tableId = masterTableId;
      first.tableNumber = masterTableNumber;
      for (const slaveOrder of rest) {
        for (const item of slaveOrder.items) {
          const existing = first.items.find(i => i.menuItem.toString() === item.menuItem.toString());
          if (existing) existing.quantity += item.quantity;
          else first.items.push({ menuItem: item.menuItem, name: item.name, price: item.price, quantity: item.quantity, specialInstructions: item.specialInstructions || '', status: item.status || 'PENDING' });
        }
        slaveOrder.status = 'CANCELLED';
        await slaveOrder.save();
      }
      const subtotal = first.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      first.subtotal = subtotal;
      first.tax = Math.round(subtotal * 0.05 * 100) / 100;
      first.total = Math.round((first.subtotal + first.tax) * 100) / 100;
      await first.save();
      return res.status(200).json({ message: 'Orders merged successfully', merged: true, order: first });
    }

    res.status(200).json({ message: 'No slave orders to merge', merged: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getAll, getOne, create, update, updateStatus, updateItemStatus, updatePayment, cancel, getStats, generateBill, processPayment, splitBill, getUnpaidOrders, applyDiscount, mergeTables };
