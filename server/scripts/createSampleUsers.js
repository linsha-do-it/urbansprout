const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function createSampleUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database successfully!');

    // Check if sample users already exist
    const existingUsers = await User.countDocuments();
    console.log(`📊 Current users in database: ${existingUsers}`);

    if (existingUsers > 2) {
      console.log('⚠️  Sample users already exist, skipping creation');
      return;
    }

    // Create sample users
    const sampleUsers = [
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        password: 'Password123!',
        role: 'beginner',
        emailVerified: true
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        password: 'Password123!',
        role: 'expert',
        emailVerified: true
      },
      {
        name: 'Mike Wilson',
        email: 'mike.wilson@example.com',
        password: 'Password123!',
        role: 'vendor',
        emailVerified: false
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        password: 'Password123!',
        role: 'beginner',
        emailVerified: true
      },
      {
        name: 'David Brown',
        email: 'david.brown@example.com',
        password: 'Password123!',
        role: 'expert',
        emailVerified: true
      }
    ];

    console.log('👥 Creating sample users...');
    const createdUsers = await User.insertMany(sampleUsers);
    
    console.log(`✅ Created ${createdUsers.length} sample users:`);
    createdUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n🎯 Sample User Credentials:');
    console.log('All sample users have password: Password123!');
    console.log('You can use these for testing user management features.');

  } catch (error) {
    console.error('❌ Error creating sample users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

createSampleUsers();


