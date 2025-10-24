#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const Admin = require('../models/Admin');

const createSuperAdmin = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database successfully!');

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('ℹ️  Super admin already exists:', existingSuperAdmin.email);
      return;
    }

    // Get admin details from command line or use defaults
    const args = process.argv.slice(2);
    const name = args[0] || 'Super Admin';
    const email = args[1] || 'admin@urbansprout.com';
    const password = args[2] || 'admin123456';

    console.log(`📝 Creating super admin with email: ${email}`);

    // Create super admin
    const superAdmin = new Admin({
      name: name.trim(),
      email: email.toLowerCase(),
      password: password,
      role: 'super_admin',
      permissions: [
        'user_management',
        'blog_management', 
        'product_management',
        'order_management',
        'analytics_view',
        'system_settings',
        'notification_management',
        'plant_suggestions'
      ],
      status: 'active',
      notes: 'Initial super admin account created during setup'
    });

    await superAdmin.save();

    console.log('✅ Super admin created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
};

// Run if this script is executed directly
if (require.main === module) {
  createSuperAdmin();
}

module.exports = createSuperAdmin;


















