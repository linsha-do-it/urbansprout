const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set ✓' : 'Not set ✗');
  
  try {
    console.log('\n🔄 Attempting to connect...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('\n✅ SUCCESS! MongoDB Connected');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);
    console.log('Ready State:', conn.connection.readyState);
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📊 Collections in database:', collections.length);
    collections.forEach(col => console.log('  -', col.name));
    
    await mongoose.connection.close();
    console.log('\n✅ Connection closed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Fix: Check your MongoDB username and password');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
      console.error('\n💡 Fix: Check your internet connection or MongoDB Atlas IP whitelist');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Fix: Connection timed out - check firewall or MongoDB Atlas configuration');
    }
    
    process.exit(1);
  }
}

testConnection();

