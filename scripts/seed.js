import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import FarmerProfile from '../src/models/FarmerProfile.js';
import Market from '../src/models/Market.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([
    User.deleteMany({}), FarmerProfile.deleteMany({}),
    Market.deleteMany({}), Product.deleteMany({}), Category.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Admin', email: 'admin@marketlink.com',
    passwordHash: await User.hashPassword('admin123'),
    phone: '03000000000', role: 'admin',
  });

  const farmerUser = await User.create({
    name: 'Bilal Ahmed', email: 'bilal@marketlink.com',
    passwordHash: await User.hashPassword('farmer123'),
    phone: '03001111111', role: 'farmer', isApproved: true,
  });


  const customer = await User.create({
    name: 'Ali Khan', email: 'ali@marketlink.com',
    passwordHash: await User.hashPassword('customer123'),
    phone: '03002222222', role: 'customer',
  });

  const market = await Market.create({
    name: 'Empress Market', address: 'Saddar, Karachi',
    lat: 24.8607, lng: 67.0011,
    operatingDays: ['Sat', 'Sun'],
    timings: { open: '06:00', close: '14:00' },
    location: { type: 'Point', coordinates: [67.0011, 24.8607] },
    createdBy: admin._id,
  });

  const farmer = await FarmerProfile.create({
    userId: farmerUser._id,
    stallName: 'Fresh Farms',
    contactPerson: 'Bilal',
    description: 'Organic vegetables and fruits',

    markets: [
      {
        marketId: market._id,
        operatingDays: ['Sat'],
        pickupStart: '08:00',
        pickupEnd: '12:00',
        cutoffHours: 4,
      },
    ],

    location: {
      address: 'Empress Market',
      lat: 24.8607,
      lng: 67.0011,
      type: 'Point',
      coordinates: [67.0011, 24.8607],
    },
  });

  await Category.insertMany([
    { name: 'Vegetables' }, { name: 'Fruits' },
    { name: 'Dairy' }, { name: 'Bakery' },
  ]);

  await Product.insertMany([
    {
      farmerId: farmer._id, name: 'Tomatoes', category: 'Vegetables',
      price: 120, unit: 'kg', stockQuantity: 50, isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea'
    },
    {
      farmerId: farmer._id, name: 'Potatoes', category: 'Vegetables',
      price: 80, unit: 'kg', stockQuantity: 100, isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655'
    },
    {
      farmerId: farmer._id, name: 'Apples', category: 'Fruits',
      price: 250, unit: 'kg', stockQuantity: 30, isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6'
    },
    {
      farmerId: farmer._id, name: 'Milk', category: 'Dairy',
      price: 200, unit: 'litre', stockQuantity: 20, isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150'
    },
  ]);

  console.log('Seeded ✓');
  console.log('Admin:    admin@marketlink.com    / admin123');
  console.log('Farmer:   bilal@marketlink.com    / farmer123');
  console.log('Customer: ali@marketlink.com      / customer123');
  process.exit(0);
};

run();