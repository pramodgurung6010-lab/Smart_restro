const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Menu = require('./models/Menu');

dotenv.config();

const initialMenuItems = [
  {
    name: 'Margherita Pizza',
    category: 'Main',
    price: 299,
    description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
    isAvailable: true,
    preparationTime: 20
  },
  {
    name: 'Caesar Salad',
    category: 'Starters',
    price: 199,
    description: 'Crisp romaine lettuce with parmesan cheese, croutons, and caesar dressing',
    isAvailable: true,
    preparationTime: 10
  },
  {
    name: 'Grilled Salmon',
    category: 'Main',
    price: 599,
    description: 'Fresh Atlantic salmon grilled to perfection with herbs and lemon',
    isAvailable: true,
    preparationTime: 25
  },
  {
    name: 'Tiramisu',
    category: 'Dessert',
    price: 149,
    description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone',
    isAvailable: true,
    preparationTime: 5
  },
  {
    name: 'Iced Tea',
    category: 'Beverage',
    price: 79,
    description: 'Refreshing iced tea with lemon and mint',
    isAvailable: true,
    preparationTime: 3
  },
  {
    name: 'Pasta Carbonara',
    category: 'Main',
    price: 349,
    description: 'Creamy pasta with bacon, eggs, and parmesan cheese',
    isAvailable: true,
    preparationTime: 18
  },
  {
    name: 'Garlic Bread',
    category: 'Starters',
    price: 99,
    description: 'Toasted bread with garlic butter and herbs',
    isAvailable: true,
    preparationTime: 8
  }
];

const seedMenu = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing menu items
    await Menu.deleteMany({});
    console.log('Cleared existing menu items');

    // Insert initial menu items
    await Menu.insertMany(initialMenuItems);
    console.log('✅ Menu items seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding menu:', error);
    process.exit(1);
  }
};

seedMenu();