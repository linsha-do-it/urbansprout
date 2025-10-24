const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function createAdminUser() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database successfully!');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.email);
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      return;
    }

    // Create admin user
    const adminData = {
      name: 'Admin User',
      email: 'admin@urbansprout.com',
      password: 'Admin123!',
      role: 'admin',
      emailVerified: true
    };

    const admin = await User.create(adminData);
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', adminData.password);
    console.log('👤 Name:', admin.name);
    console.log('🔐 Role:', admin.role);

    console.log('\n🎯 Admin Login Credentials:');
    console.log('Email: admin@urbansprout.com');
    console.log('Password: Admin123!');
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

createAdminUser();


