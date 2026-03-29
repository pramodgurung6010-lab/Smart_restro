const Menu = require('../models/Menu');

const getAll = async (req, res) => {
  try {
    const { category, available, search } = req.query;
    let query = {};
    if (category && category !== 'All') query.category = category;
    if (available !== undefined) query.isAvailable = available === 'true';
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    const menuItems = await Menu.find(query).sort({ category: 1, name: 1 });
    res.status(200).json(menuItems);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getOne = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
    res.status(200).json(menuItem);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { name, category, price, description, isAvailable, preparationTime } = req.body;
    const existingItem = await Menu.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingItem) return res.status(400).json({ message: 'Menu item with this name already exists' });

    const newMenuItem = new Menu({
      name, category, price, description,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      preparationTime: preparationTime || 15
    });
    await newMenuItem.save();
    res.status(201).json({ message: 'Menu item created successfully', menuItem: newMenuItem });
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json({ message: 'Validation error', details: Object.values(err.errors).map(e => e.message) });
    res.status(500).json({ message: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    if (updateData.name) {
      const existingItem = await Menu.findOne({ _id: { $ne: id }, name: { $regex: new RegExp(`^${updateData.name}$`, 'i') } });
      if (existingItem) return res.status(400).json({ message: 'Menu item with this name already exists' });
    }
    const updatedMenuItem = await Menu.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedMenuItem) return res.status(404).json({ message: 'Menu item not found' });
    res.status(200).json({ message: 'Menu item updated successfully', menuItem: updatedMenuItem });
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json({ message: 'Validation error', details: Object.values(err.errors).map(e => e.message) });
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleAvailability = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();
    res.status(200).json({ message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'} successfully`, menuItem });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const deletedMenuItem = await Menu.findByIdAndDelete(req.params.id);
    if (!deletedMenuItem) return res.status(404).json({ message: 'Menu item not found' });
    res.status(200).json({ message: 'Menu item deleted successfully', menuItem: deletedMenuItem });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAll, getOne, create, update, toggleAvailability, remove };
