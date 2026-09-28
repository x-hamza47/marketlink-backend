import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import FarmerProfile from '../src/models/FarmerProfile.js';
import Market from '../src/models/Market.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import Order from '../src/models/Order.js';
import Review from '../src/models/Review.js';
import Announcement from '../src/models/Announcement.js';
import Notification from '../src/models/Notification.js';

const run = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Clearing existing data...');

    await Promise.all([
      User.deleteMany({}),
      FarmerProfile.deleteMany({}),
      Market.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      Announcement.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('Seeding master categories...');
    await Category.insertMany([
      { name: 'Vegetables' },
      { name: 'Fruits' },
      { name: 'Dairy & Eggs' },
      { name: 'Bakery & Grains' },
      { name: 'Honey & Herbs' },
    ]);

    console.log('Seeding users...');
    const adminPassword = await User.hashPassword('admin123');
    const farmerPassword = await User.hashPassword('farmer123');
    const customerPassword = await User.hashPassword('customer123');

    // Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@marketlink.com',
      passwordHash: adminPassword,
      phone: '03001234567',
      address: 'MarketLink Central HQ, Karachi',
      role: 'admin',
      isActive: true,
      isApproved: true,
    });

    // Farmers
    const farmerUser1 = await User.create({
      name: 'Bilal Ahmed',
      email: 'bilal@marketlink.com',
      passwordHash: farmerPassword,
      phone: '03123456789',
      address: 'Malir Farm Road, Karachi',
      role: 'farmer',
      isActive: true,
      isApproved: true,
    });

    const farmerUser2 = await User.create({
      name: 'Tariq Mehmood',
      email: 'tariq@marketlink.com',
      passwordHash: farmerPassword,
      phone: '03219876543',
      address: 'Hub River Road, Gadap, Karachi',
      role: 'farmer',
      isActive: true,
      isApproved: true,
    });

    const farmerUser3 = await User.create({
      name: 'Fatima Zahra',
      email: 'fatima@marketlink.com',
      passwordHash: farmerPassword,
      phone: '03335554433',
      address: 'Chack 45, Bedian Road, Lahore',
      role: 'farmer',
      isActive: true,
      isApproved: true,
    });

    // Pending Farmer for admin moderation testing
    const pendingFarmer = await User.create({
      name: 'Zubair Qureshi',
      email: 'zubair@marketlink.com',
      passwordHash: farmerPassword,
      phone: '03451122334',
      address: 'Sheikhupura Road, Lahore',
      role: 'farmer',
      isActive: true,
      isApproved: false,
    });

    // Customers
    const customer1 = await User.create({
      name: 'Ali Khan',
      email: 'ali@marketlink.com',
      passwordHash: customerPassword,
      phone: '03009988776',
      address: 'DHA Phase 5, Karachi',
      role: 'customer',
      isActive: true,
    });

    const customer2 = await User.create({
      name: 'Sara Siddiqui',
      email: 'sara@marketlink.com',
      passwordHash: customerPassword,
      phone: '03157766554',
      address: 'Gulshan-e-Iqbal Block 6, Karachi',
      role: 'customer',
      isActive: true,
    });

    console.log('Seeding farmers markets...');
    const market1 = await Market.create({
      name: 'Empress Farmers Market',
      address: 'Preedy Street, Saddar, Karachi',
      lat: 24.8607,
      lng: 67.0011,
      operatingDays: ['Fri', 'Sat', 'Sun'],
      timings: { open: '07:00', close: '14:00' },
      location: { type: 'Point', coordinates: [67.0011, 24.8607] },
      isActive: true,
      createdBy: admin._id,
    });

    const market2 = await Market.create({
      name: 'Clifton Sunday Fresh Bazaar',
      address: 'Beach Avenue, Block 4 Clifton, Karachi',
      lat: 24.8215,
      lng: 67.0315,
      operatingDays: ['Sat', 'Sun'],
      timings: { open: '08:00', close: '16:00' },
      location: { type: 'Point', coordinates: [67.0315, 24.8215] },
      isActive: true,
      createdBy: admin._id,
    });

    const market3 = await Market.create({
      name: 'DHA Phase 6 Organic Market',
      address: 'Khayaban-e-Seher, Phase 6 DHA, Karachi',
      lat: 24.8012,
      lng: 67.0654,
      operatingDays: ['Wed', 'Thu', 'Sat'],
      timings: { open: '09:00', close: '17:00' },
      location: { type: 'Point', coordinates: [67.0654, 24.8012] },
      isActive: true,
      createdBy: admin._id,
    });

    const market4 = await Market.create({
      name: 'Gulberg Green Community Market',
      address: 'Main Boulevard, Gulberg III, Lahore',
      lat: 31.5204,
      lng: 74.3587,
      operatingDays: ['Sat', 'Sun'],
      timings: { open: '08:00', close: '15:00' },
      location: { type: 'Point', coordinates: [74.3587, 31.5204] },
      isActive: true,
      createdBy: admin._id,
    });

    console.log('Seeding farmer profiles...');
    const farmerProfile1 = await FarmerProfile.create({
      userId: farmerUser1._id,
      stallName: 'Green Valley Organics',
      contactPerson: 'Bilal Ahmed',
      description: 'Pesticide-free organic seasonal vegetables, sweet strawberries, and farm herbs.',
      rating: 4.8,
      totalReviews: 2,
      markets: [
        {
          marketId: market1._id,
          operatingDays: ['Fri', 'Sat', 'Sun'],
          pickupStart: '08:00',
          pickupEnd: '13:00',
          cutoffHours: 4,
        },
        {
          marketId: market2._id,
          operatingDays: ['Sat', 'Sun'],
          pickupStart: '09:00',
          pickupEnd: '15:00',
          cutoffHours: 6,
        },
      ],
      location: {
        address: 'Empress Market, Saddar, Karachi',
        lat: 24.8607,
        lng: 67.0011,
        type: 'Point',
        coordinates: [67.0011, 24.8607],
      },
    });

    const farmerProfile2 = await FarmerProfile.create({
      userId: farmerUser2._id,
      stallName: 'Sindh Orchard & Citrus Groves',
      contactPerson: 'Tariq Mehmood',
      description: 'Fresh farm fruits, cold-pressed raw honey, and organic desi poultry items.',
      rating: 4.9,
      totalReviews: 1,
      markets: [
        {
          marketId: market2._id,
          operatingDays: ['Sat', 'Sun'],
          pickupStart: '09:00',
          pickupEnd: '14:00',
          cutoffHours: 4,
        },
        {
          marketId: market3._id,
          operatingDays: ['Wed', 'Thu'],
          pickupStart: '10:00',
          pickupEnd: '16:00',
          cutoffHours: 5,
        },
      ],
      location: {
        address: 'Clifton Beach Avenue, Karachi',
        lat: 24.8215,
        lng: 67.0315,
        type: 'Point',
        coordinates: [67.0315, 24.8215],
      },
    });

    const farmerProfile3 = await FarmerProfile.create({
      userId: farmerUser3._id,
      stallName: 'Pure Pastures Dairy & Bakes',
      contactPerson: 'Fatima Zahra',
      description: 'Raw cow & buffalo milk, artisanal butter, country free-range eggs, and sourdough bread.',
      rating: 5.0,
      totalReviews: 1,
      markets: [
        {
          marketId: market4._id,
          operatingDays: ['Sat', 'Sun'],
          pickupStart: '08:30',
          pickupEnd: '14:00',
          cutoffHours: 4,
        },
      ],
      location: {
        address: 'Main Boulevard Gulberg, Lahore',
        lat: 31.5204,
        lng: 74.3587,
        type: 'Point',
        coordinates: [74.3587, 31.5204],
      },
    });

    console.log('Seeding products...');
    const p1 = await Product.create({
      farmerId: farmerProfile1._id,
      name: 'Organic Red Tomatoes',
      category: 'Vegetables',
      price: 140,
      unit: 'kg',
      stockQuantity: 45,
      isAvailable: true,
      description: 'Vine-ripened organic tomatoes grown without synthetic fertilizers.',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop',
    });

    const p2 = await Product.create({
      farmerId: farmerProfile1._id,
      name: 'Farm Fresh Spinach (Palak)',
      category: 'Vegetables',
      price: 60,
      unit: 'bunch',
      stockQuantity: 30,
      isAvailable: true,
      description: 'Crisp, nutrient-dense green spinach harvested morning of market day.',
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop',
    });

    const p3 = await Product.create({
      farmerId: farmerProfile1._id,
      name: 'Baby Red Potatoes',
      category: 'Vegetables',
      price: 90,
      unit: 'kg',
      stockQuantity: 80,
      isAvailable: true,
      description: 'Freshly dug tender baby red potatoes with delicate skin.',
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop',
    });

    const p4 = await Product.create({
      farmerId: farmerProfile2._id,
      name: 'Sindhri Mangoes (Premium)',
      category: 'Fruits',
      price: 320,
      unit: 'kg',
      stockQuantity: 25,
      isAvailable: true,
      description: 'Naturally tree-ripened Sindhri mangoes known for their aromatic sweetness.',
      imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop',
    });

    const p5 = await Product.create({
      farmerId: farmerProfile2._id,
      name: 'Wild Sidr Raw Honey',
      category: 'Honey & Herbs',
      price: 1200,
      unit: 'piece',
      stockQuantity: 15,
      isAvailable: true,
      description: 'Pure, unpasteurized natural Sidr honey harvested from local valleys.',
      imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop',
    });

    const p6 = await Product.create({
      farmerId: farmerProfile3._id,
      name: 'Farm Pure Buffalo Milk',
      category: 'Dairy & Eggs',
      price: 210,
      unit: 'litre',
      stockQuantity: 35,
      isAvailable: true,
      description: 'Rich, whole buffalo milk unadulterated directly from grass-fed cattle.',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop',
    });

    const p7 = await Product.create({
      farmerId: farmerProfile3._id,
      name: 'Organic Desi Eggs',
      category: 'Dairy & Eggs',
      price: 360,
      unit: 'dozen',
      stockQuantity: 20,
      isAvailable: true,
      description: 'Free-range desi country hen eggs rich in omega-3 and yolk color.',
      imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&auto=format&fit=crop',
    });

    const p8 = await Product.create({
      farmerId: farmerProfile3._id,
      name: 'Artisan Sourdough Loaf',
      category: 'Bakery & Grains',
      price: 280,
      unit: 'piece',
      stockQuantity: 12,
      isAvailable: true,
      description: 'Slow-fermented artisan sourdough baked in stone hearth ovens.',
      imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=600&auto=format&fit=crop',
    });

    console.log('Seeding customer favorites...');
    customer1.favorites = [farmerProfile1._id, farmerProfile2._id];
    customer1.favoriteProducts = [p1._id, p4._id];
    await customer1.save();

    console.log('Seeding orders...');
    const order1 = await Order.create({
      customerId: customer1._id,
      farmerId: farmerProfile1._id,
      marketId: market1._id,
      items: [
        { productId: p1._id, name: p1.name, price: p1.price, quantity: 2, unit: p1.unit, imageUrl: p1.imageUrl },
        { productId: p2._id, name: p2.name, price: p2.price, quantity: 1, unit: p2.unit, imageUrl: p2.imageUrl },
      ],
      totalAmount: 340,
      status: 'completed',
      pickupDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      pickupWindow: { startTime: '08:00', endTime: '12:00' },
      cutoffTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: 'Please pack in eco-friendly paper bags.',
    });

    const order2 = await Order.create({
      customerId: customer2._id,
      farmerId: farmerProfile2._id,
      marketId: market2._id,
      items: [
        { productId: p4._id, name: p4.name, price: p4.price, quantity: 3, unit: p4.unit, imageUrl: p4.imageUrl },
      ],
      totalAmount: 960,
      status: 'ready',
      pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      pickupWindow: { startTime: '09:00', endTime: '14:00' },
      cutoffTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
      notes: 'Will pick up around 10:30 AM.',
    });

    const order3 = await Order.create({
      customerId: customer1._id,
      farmerId: farmerProfile1._id,
      marketId: market1._id,
      items: [
        { productId: p3._id, name: p3.name, price: p3.price, quantity: 2, unit: p3.unit, imageUrl: p3.imageUrl },
      ],
      totalAmount: 180,
      status: 'placed',
      pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      pickupWindow: { startTime: '08:00', endTime: '12:00' },
      cutoffTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      notes: 'Thanks!',
    });

    console.log('Seeding customer reviews & farmer responses...');
    await Review.create({
      orderId: order1._id,
      productId: p1._id,
      farmerId: farmerProfile1._id,
      customerId: customer1._id,
      rating: 5,
      comment: 'Super fresh and sweet tomatoes! Loved the pickup experience at Empress Market.',
      farmerResponse: 'Thank you so much Ali! We harvest early in the morning so you always get the freshest basket.',
      status: 'visible',
    });

    console.log('Seeding platform announcements...');
    await Announcement.create({
      title: 'Welcome to MarketLink Season Opening!',
      message: 'Explore over 5 local farmers markets in your area. Pre-order your weekly baskets for guaranteed availability at stall pickup.',
      audience: 'all',
      status: 'published',
      createdBy: admin._id,
    });

    await Announcement.create({
      title: 'Farmer Stalls Guidelines 2026',
      message: 'Please keep your weekly inventory updated by Thursday evening to receive early customer pre-orders.',
      audience: 'farmers',
      status: 'published',
      createdBy: admin._id,
    });

    console.log('Seeding notifications...');
    await Notification.create({
      userId: customer1._id,
      type: 'order_completed',
      message: 'Order #340 is marked completed. Please leave a review!',
      link: '/orders',
    });

    await Notification.create({
      userId: farmerUser1._id,
      type: 'order_placed',
      message: `New pre-order #${order3._id.toString().slice(-6)} placed for pickup`,
      link: '/farmer/orders',
    });

    await Notification.create({
      userId: farmerUser1._id,
      type: 'review_received',
      message: 'New 5★ review received on Organic Red Tomatoes',
      link: '/farmer/reviews',
    });

    console.log('\n======================================================');
    console.log('✓ SEEDING COMPLETED SUCCESSFULLY');
    console.log('======================================================');
    console.log('LOGIN CREDENTIALS:');
    console.log('------------------------------------------------------');
    console.log('ADMIN:');
    console.log('  Email:    admin@marketlink.com');
    console.log('  Password: admin123\n');
    console.log('FARMERS:');
    console.log('  1. Bilal (Approved):   bilal@marketlink.com   / farmer123');
    console.log('  2. Tariq (Approved):   tariq@marketlink.com   / farmer123');
    console.log('  3. Fatima (Approved):  fatima@marketlink.com  / farmer123');
    console.log('  4. Zubair (Pending):   zubair@marketlink.com  / farmer123\n');
    console.log('CUSTOMERS:');
    console.log('  1. Ali:    ali@marketlink.com    / customer123');
    console.log('  2. Sara:   sara@marketlink.com   / customer123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

run();