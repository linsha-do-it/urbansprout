const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Setup Permanent Database for UrbanSprout
 * This script helps configure and test your permanent database setup
 */

async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    console.log(`🔗 Connecting to: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Database connection successful!');
    console.log(`📊 Connected to: ${conn.connection.host}`);
    console.log(`🗄️ Database: ${conn.connection.name}`);
    
    // Test basic operations
    await testDatabaseOperations();
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Check your MONGODB_URI in .env file');
    console.error('2. Ensure MongoDB service is running (for local)');
    console.error('3. Check network connectivity (for Atlas)');
    console.error('4. Verify database credentials');
    process.exit(1);
  }
}

async function testDatabaseOperations() {
  try {
    console.log('\n🧪 Testing database operations...');
    
    // Test collection creation and data insertion
    const testCollection = mongoose.connection.db.collection('test_connection');
    
    // Insert test document
    const testDoc = {
      message: 'Database test successful',
      timestamp: new Date(),
      testId: Math.random().toString(36).substr(2, 9)
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ Document insertion test passed');
    
    // Test document retrieval
    const retrievedDoc = await testCollection.findOne({ _id: insertResult.insertedId });
    if (retrievedDoc && retrievedDoc.message === testDoc.message) {
      console.log('✅ Document retrieval test passed');
    } else {
      throw new Error('Document retrieval failed');
    }
    
    // Test document update
    await testCollection.updateOne(
      { _id: insertResult.insertedId },
      { $set: { updated: true } }
    );
    console.log('✅ Document update test passed');
    
    // Test document deletion
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Document deletion test passed');
    
    console.log('🎉 All database operations test passed!');
    
  } catch (error) {
    console.error('❌ Database operations test failed:', error.message);
    throw error;
  }
}

function createEnvTemplate() {
  const envTemplate = `# UrbanSprout Environment Configuration
# =====================================

# Database Configuration
# Choose ONE of the following options:

# Option 1: MongoDB Atlas (Cloud - Recommended for production)
# MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/urbansprout?retryWrites=true&w=majority

# Option 2: Local MongoDB (Development)
MONGODB_URI=mongodb://localhost:27017/urbansprout

# Option 3: MongoDB with Docker
# MONGODB_URI=mongodb://localhost:27017/urbansprout

# Server Configuration
NODE_ENV=development
PORT=5001

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Razorpay Configuration (Optional)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Firebase Configuration (Optional)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Admin Configuration
ADMIN_EMAIL=admin@urbansprout.com
ADMIN_PASSWORD=admin123

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads`;

  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envTemplate);
    console.log('📝 Created .env template file');
    console.log('⚠️  Please update the MONGODB_URI with your actual database connection string');
  } else {
    console.log('📝 .env file already exists');
  }
}

function checkEnvironmentSetup() {
  console.log('🔍 Checking environment setup...');
  
  const requiredVars = ['MONGODB_URI'];
  const optionalVars = ['JWT_SECRET', 'NODE_ENV', 'PORT'];
  
  let missingRequired = [];
  let missingOptional = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingRequired.push(varName);
    }
  });
  
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      missingOptional.push(varName);
    }
  });
  
  if (missingRequired.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingRequired.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    return false;
  }
  
  if (missingOptional.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    missingOptional.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
  }
  
  console.log('✅ Environment setup check passed');
  return true;
}

function displaySetupInstructions() {
  console.log('\n📋 Database Setup Instructions:');
  console.log('================================');
  console.log('');
  console.log('1. 🏗️  Choose your database option:');
  console.log('   • MongoDB Atlas (Cloud) - Recommended for production');
  console.log('   • Local MongoDB - Good for development');
  console.log('   • Docker MongoDB - Consistent across environments');
  console.log('');
  console.log('2. 📝 Create server/.env with MONGODB_URI');
  console.log('   • Add MONGODB_URI=your_connection_string to server/.env');
  console.log('   • See README.md for setup instructions');
  console.log('');
  console.log('3. 🧪 Test your setup:');
  console.log('   • Run: node scripts/setupPermanentDatabase.js');
  console.log('   • Verify all tests pass');
  console.log('');
  console.log('4. 🚀 Start your application:');
  console.log('   • Run: npm run dev');
  console.log('   • Check for "✅ MongoDB Connected" message');
  console.log('');
  console.log('5. 💾 Set up regular backups:');
  console.log('   • Run: node scripts/backupDatabase.js');
  console.log('   • Schedule regular backups');
  console.log('');
  console.log('📖 For setup instructions, see the project README.md');
}

async function main() {
  console.log('🌱 UrbanSprout Permanent Database Setup');
  console.log('=======================================');
  
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    displaySetupInstructions();
    return;
  }
  
  if (args.includes('--create-env') || args.includes('-e')) {
    createEnvTemplate();
    return;
  }
  
  if (args.includes('--check-env') || args.includes('-c')) {
    checkEnvironmentSetup();
    return;
  }
  
  // Default: full setup and test
  createEnvTemplate();
  
  if (!checkEnvironmentSetup()) {
    console.log('\n❌ Please fix the environment setup issues above and try again.');
    console.log('💡 Run with --help for setup instructions');
    return;
  }
  
  await testDatabaseConnection();
  
  console.log('\n🎉 Database setup completed successfully!');
  console.log('🚀 Your database is now permanent and ready to use.');
  console.log('\n📋 Next steps:');
  console.log('1. Start your server: npm run dev');
  console.log('2. Create admin user: node scripts/createAdmin.js');
  console.log('3. Populate sample data: node scripts/populateGardeningStore.js');
  console.log('4. Set up regular backups: node scripts/backupDatabase.js');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  testDatabaseConnection, 
  testDatabaseOperations, 
  createEnvTemplate, 
  checkEnvironmentSetup 
};




