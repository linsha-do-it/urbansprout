const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
const User = require('../models/User');
const Blog = require('../models/Blog');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const notificationService = require('../utils/notificationService');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urbansprout');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test notification system
const testNotifications = async () => {
  try {
    console.log('🧪 Testing Notification System...\n');

    // Find a test user
    const testUser = await User.findOne({ role: { $ne: 'admin' } });
    if (!testUser) {
      console.log('❌ No test user found. Please create a user first.');
      return;
    }

    console.log(`👤 Testing with user: ${testUser.name} (${testUser.email})`);

    // Test 1: Blog approval notification
    console.log('\n📝 Test 1: Blog Approval Notification');
    try {
      await notificationService.sendNotification(testUser._id, {
        userEmail: testUser.email,
        type: 'blog_approved',
        title: '✅ Blog Post Approved!',
        message: 'Your blog post "Test Post" has been approved and is now live!',
        relatedId: new mongoose.Types.ObjectId(),
        relatedModel: 'Blog'
      });
      console.log('✅ Blog approval notification sent successfully');
    } catch (error) {
      console.log('❌ Blog approval notification failed:', error.message);
    }

    // Test 2: Blog rejection notification
    console.log('\n📝 Test 2: Blog Rejection Notification');
    try {
      await notificationService.sendNotification(testUser._id, {
        userEmail: testUser.email,
        type: 'blog_rejected',
        title: '❌ Blog Post Rejected',
        message: 'Your blog post "Test Post" has been rejected. Reason: Content not suitable.',
        relatedId: new mongoose.Types.ObjectId(),
        relatedModel: 'Blog'
      });
      console.log('✅ Blog rejection notification sent successfully');
    } catch (error) {
      console.log('❌ Blog rejection notification failed:', error.message);
    }

    // Test 3: Order placement notification
    console.log('\n🛒 Test 3: Order Placement Notification');
    try {
      await notificationService.sendNotification(testUser._id, {
        userEmail: testUser.email,
        type: 'order_placed',
        title: '🛒 Order Placed Successfully!',
        message: 'Your order #ORD123456 has been placed successfully!',
        relatedId: new mongoose.Types.ObjectId(),
        relatedModel: 'Order'
      });
      console.log('✅ Order placement notification sent successfully');
    } catch (error) {
      console.log('❌ Order placement notification failed:', error.message);
    }

    // Test 4: Blog like notification
    console.log('\n❤️ Test 4: Blog Like Notification');
    try {
      await notificationService.sendNotification(testUser._id, {
        userEmail: testUser.email,
        type: 'blog_like',
        title: '❤️ New Like!',
        message: 'Someone liked your blog post "Test Post"',
        relatedId: new mongoose.Types.ObjectId(),
        relatedModel: 'Blog'
      });
      console.log('✅ Blog like notification sent successfully');
    } catch (error) {
      console.log('❌ Blog like notification failed:', error.message);
    }

    // Test 5: Blog comment notification
    console.log('\n💬 Test 5: Blog Comment Notification');
    try {
      await notificationService.sendNotification(testUser._id, {
        userEmail: testUser.email,
        type: 'blog_comment',
        title: '💬 New Comment!',
        message: 'Someone commented on your blog post "Test Post"',
        relatedId: new mongoose.Types.ObjectId(),
        relatedModel: 'Blog'
      });
      console.log('✅ Blog comment notification sent successfully');
    } catch (error) {
      console.log('❌ Blog comment notification failed:', error.message);
    }

    // Check total notifications created
    const totalNotifications = await Notification.countDocuments({ userId: testUser._id });
    console.log(`\n📊 Total notifications for user: ${totalNotifications}`);

    // Check unread notifications
    const unreadNotifications = await Notification.countDocuments({ 
      userId: testUser._id, 
      isRead: false 
    });
    console.log(`📊 Unread notifications: ${unreadNotifications}`);

    console.log('\n✅ Notification system test completed!');
    console.log('\n💡 To test the UI:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Start the client: cd client && npm run dev');
    console.log('3. Login with the test user');
    console.log('4. Check the notification bell icon in the top bar');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run tests
const runTests = async () => {
  await connectDB();
  await testNotifications();
  await mongoose.connection.close();
  console.log('\n🔌 Database connection closed');
};

runTests();




