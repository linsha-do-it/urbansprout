#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const User = require('../models/User');
const Admin = require('../models/Admin');

const migrateAdmins = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database successfully!');

    // Find all users with admin role
    console.log('🔍 Finding admin users...');
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`📊 Found ${adminUsers.length} admin users`);

    if (adminUsers.length === 0) {
      console.log('ℹ️  No admin users found to migrate');
      return;
    }

    // Migrate each admin user
    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of adminUsers) {
      try {
        // Check if admin already exists in Admin collection
        const existingAdmin = await Admin.findOne({ email: user.email });
        
        if (existingAdmin) {
          console.log(`⏭️  Admin ${user.email} already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Create new admin document
        const adminData = {
          name: user.name || user.displayName || 'Admin User',
          email: user.email,
          password: user.password || 'tempPassword123', // Will be hashed by pre-save middleware
          role: 'admin',
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
          profile: {
            avatar: user.avatar || null,
            bio: user.bio || null,
            phone: user.phone || null
          },
          security: {
            twoFactorEnabled: false,
            passwordChangedAt: user.passwordChangedAt || new Date(),
            passwordResetToken: user.passwordResetToken || null,
            passwordResetExpires: user.passwordResetExpires || null
          },
          activity: {
            lastActivity: user.lastLogin || new Date(),
            totalLogins: user.loginCount || 0
          },
          notes: `Migrated from User collection on ${new Date().toISOString()}. Password: tempPassword123 - Please change after first login.`
        };

        const newAdmin = new Admin(adminData);
        await newAdmin.save();

        console.log(`✅ Migrated admin: ${user.email}`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrating admin ${user.email}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} admins`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount} admins`);
    console.log(`❌ Failed: ${adminUsers.length - migratedCount - skippedCount} admins`);

    // Optional: Remove admin role from User collection (uncomment if desired)
    /*
    console.log('\n🗑️  Removing admin role from User collection...');
    const updateResult = await User.updateMany(
      { role: 'admin' },
      { $unset: { role: 1 } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} users`);
    */

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  migrateAdmins();
}

module.exports = migrateAdmins;
