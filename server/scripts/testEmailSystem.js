const { sendRegistrationEmail, sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../utils/emailService');
require('dotenv').config({ path: '../../.env' });

async function testEmailSystem() {
  console.log('🧪 Testing UrbanSprout Email System');
  console.log('===================================\n');
  
  const testEmail = 'lxiao0391@gmail.com';
  const testUser = 'Test User';
  
  console.log('📧 Test Email:', testEmail);
  console.log('👤 Test User:', testUser);
  console.log('🔧 Email Config:', {
    user: process.env.EMAIL_USER,
    passLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
    passStartsWith: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 4) + '...' : 'undefined'
  });
  console.log('');
  
  // Test 1: Registration Email
  console.log('1️⃣ Testing Registration Email...');
  try {
    const regResult = await sendRegistrationEmail(testEmail, testUser, 'beginner');
    console.log('   Result:', regResult.success ? '✅ Success' : '❌ Failed');
    if (!regResult.success) {
      console.log('   Error:', regResult.error);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log('');
  
  // Test 2: Order Confirmation Email
  console.log('2️⃣ Testing Order Confirmation Email...');
  try {
    const orderDetails = {
      orderId: 'TEST123',
      orderNumber: 'ORD-TEST-123',
      orderDate: new Date(),
      totalAmount: 99.99,
      items: [
        { name: 'Test Plant', quantity: 1, price: 99.99 }
      ],
      shippingAddress: '123 Test St, Test City, TC 12345',
      estimatedDelivery: '2025-01-15',
      paymentMethod: 'Credit Card',
      paymentStatus: 'Paid'
    };
    
    const orderResult = await sendOrderConfirmationEmail(testEmail, testUser, orderDetails);
    console.log('   Result:', orderResult.success ? '✅ Success' : '❌ Failed');
    if (!orderResult.success) {
      console.log('   Error:', orderResult.error);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log('');
  
  // Test 3: Order Status Update Email
  console.log('3️⃣ Testing Order Status Update Email...');
  try {
    const statusDetails = {
      orderId: 'TEST123',
      status: 'shipped',
      updatedAt: new Date(),
      trackingNumber: 'TRK123456789',
      estimatedDelivery: '2025-01-20'
    };
    
    const statusResult = await sendOrderStatusUpdateEmail(testEmail, testUser, statusDetails);
    console.log('   Result:', statusResult.success ? '✅ Success' : '❌ Failed');
    if (!statusResult.success) {
      console.log('   Error:', statusResult.error);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log('');
  
  console.log('🎯 Email System Test Complete!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. If emails are being simulated, configure real email credentials');
  console.log('2. Run: node scripts/setupEmailCredentials.js');
  console.log('3. Or manually update .env with your email credentials');
  console.log('4. Restart the server after updating credentials');
}

testEmailSystem().catch(console.error);






