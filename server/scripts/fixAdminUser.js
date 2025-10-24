const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function checkAndFixAdminUser() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database successfully!');

    // Check if the admin user exists
    const adminUser = await User.findOne({ email: 'lxiao0391@gmail.com' });
    
    if (adminUser) {
      console.log('👤 Found existing user:');
      console.log('📧 Email:', adminUser.email);
      console.log('👤 Name:', adminUser.name);
      console.log('🔐 Role:', adminUser.role);
      console.log('📅 Created:', adminUser.createdAt);
      
      // Update role to admin if it's not already
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        console.log('✅ Updated role to admin');
      } else {
        console.log('✅ User is already an admin');
      }
      
      // Update password to the specified one
      const salt = await bcrypt.genSalt(10);
      adminUser.password = await bcrypt.hash('Admin@12345', salt);
      await adminUser.save();
      console.log('✅ Updated password to Admin@12345');
      
    } else {
      console.log('❌ User not found, creating new admin user...');
      
      // Create new admin user
      const adminData = {
        name: 'Admin User',
        email: 'lxiao0391@gmail.com',
        password: 'Admin@12345',
        role: 'admin',
        emailVerified: true
      };

      const admin = await User.create(adminData);
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', admin.email);
      console.log('🔑 Password:', adminData.password);
      console.log('👤 Name:', admin.name);
      console.log('🔐 Role:', admin.role);
    }

    console.log('\n🎯 Admin Login Credentials:');
    console.log('Email: lxiao0391@gmail.com');
    console.log('Password: Admin@12345');
    console.log('Role: admin');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkAndFixAdminUser();


