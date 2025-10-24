const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');
const notificationService = require('../utils/notificationService');
require('dotenv').config();

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

// Create test notifications for a specific user
const createTestNotifications = async () => {
  try {
    console.log('🧪 Creating Test Notifications...\n');

    // Find a test user (not admin)
    const testUser = await User.findOne({ role: { $ne: 'admin' } });
    if (!testUser) {
      console.log('❌ No test user found. Please create a user first.');
      return;
    }

    console.log(`👤 Creating notifications for: ${testUser.name} (${testUser.email})`);

    // Clear existing notifications for this user
    await Notification.deleteMany({ userId: testUser._id });
    console.log('🗑️ Cleared existing notifications');

    // Create test notifications
    const testNotifications = [
      {
        userEmail: testUser.email,
        type: 'blog_approved',
        title: '✅ Blog Post Approved!',
        message: 'Your blog post "How to Grow Tomatoes" has been approved and is now live!',
        relatedId: new mongoose.Types.ObjectId(),
        relatedModel: 'Blog'
      },
      {
        userEmail: testUser.email,
        type: 'blog_like',
        title: '❤️ New Like!',
        message: 'Someone liked your blog post "Indoor Plant Care Tips"',
        relatedId: new mongoose.Types.ObjectId(),
        relatedModel: 'Blog'
      },
      {
        userEmail: testUser.email,
        type: 'blog_comment',
        title: '💬 New Comment!',
        message: 'Someone commented on your blog post "Organic Gardening Guide"',
        relatedId: new mongoose.Types.ObjectId(),
        relatedModel: 'Blog'
      },
      {
        userEmail: testUser.email,
        type: 'order_placed',
        title: '🛒 Order Placed Successfully!',
        message: 'Your order #ORD123456 has been placed successfully!',
        relatedId: new mongoose.Types.ObjectId(),
        relatedModel: 'Order'
      },
      {
        userEmail: testUser.email,
        type: 'blog_rejected',
        title: '❌ Blog Post Rejected',
        message: 'Your blog post "Plant Care Basics" has been rejected. Reason: Content needs improvement.',
        relatedId: new mongoose.Types.ObjectId(),
        relatedModel: 'Blog'
      }
    ];

    // Create notifications
    for (const notifData of testNotifications) {
      try {
        await notificationService.sendNotification(testUser._id, notifData);
        console.log(`✅ Created notification: ${notifData.title}`);
      } catch (error) {
        console.error(`❌ Failed to create notification: ${notifData.title}`, error.message);
      }
    }

    // Verify notifications were created
    const totalNotifications = await Notification.countDocuments({ userId: testUser._id });
    const unreadNotifications = await Notification.countDocuments({ userId: testUser._id, isRead: false });

    console.log(`\n📊 Notification Summary:`);
    console.log(`Total notifications: ${totalNotifications}`);
    console.log(`Unread notifications: ${unreadNotifications}`);

    // Show recent notifications
    const recentNotifications = await Notification.find({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`\n📋 Recent notifications:`);
    recentNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. [${notif.isRead ? 'READ' : 'UNREAD'}] ${notif.title}`);
      console.log(`   ${notif.message}`);
      console.log(`   Created: ${notif.createdAt.toLocaleString()}`);
      console.log('');
    });

    console.log('✅ Test notifications created successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Start the frontend: cd client && npm run dev');
    console.log('2. Login with the test user account');
    console.log('3. Check the notification bell icon in the top navigation');
    console.log('4. Click the bell to see the notifications dropdown');

  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await createTestNotifications();
  await mongoose.connection.close();
  console.log('\n🔌 Database connection closed');
};

runTest();




