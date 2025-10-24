#!/usr/bin/env node

/**
 * Test Script for Email OTP Verification
 * 
 * This script tests the complete OTP verification flow:
 * 1. Send OTP to email
 * 2. Verify OTP
 * 3. Resend OTP
 * 
 * Usage: node test-email-otp.js
 */

const API_BASE_URL = 'http://localhost:5001/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[Step ${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com', // Change this to your email for real testing
  password: 'TestPassword123!',
  role: 'beginner'
};

async function sendOTP() {
  logStep(1, 'Sending OTP to email...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();

    if (data.success) {
      logSuccess('OTP sent successfully!');
      logInfo(`Email: ${data.data.email}`);
      logInfo(`Expires in: ${data.data.expiresIn}`);
      logWarning('Check your email for the OTP code (or server console logs in development)');
      return true;
    } else {
      logError(`Failed to send OTP: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Error sending OTP: ${error.message}`);
    return false;
  }
}

async function verifyOTP(otp) {
  logStep(2, 'Verifying OTP...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        otp: otp
      })
    });

    const data = await response.json();

    if (data.success) {
      logSuccess('OTP verified successfully!');
      logInfo(`User ID: ${data.data.user.id}`);
      logInfo(`Name: ${data.data.user.name}`);
      logInfo(`Email: ${data.data.user.email}`);
      logInfo(`Email Verified: ${data.data.user.emailVerified}`);
      logInfo(`Token: ${data.data.token.substring(0, 20)}...`);
      return true;
    } else {
      logError(`Failed to verify OTP: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Error verifying OTP: ${error.message}`);
    return false;
  }
}

async function resendOTP() {
  logStep(3, 'Resending OTP...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email
      })
    });

    const data = await response.json();

    if (data.success) {
      logSuccess('New OTP sent successfully!');
      logInfo(`Email: ${data.data.email}`);
      logInfo(`Expires in: ${data.data.expiresIn}`);
      return true;
    } else {
      logError(`Failed to resend OTP: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Error resending OTP: ${error.message}`);
    return false;
  }
}

async function testInvalidOTP() {
  logStep(4, 'Testing invalid OTP...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        otp: '000000' // Invalid OTP
      })
    });

    const data = await response.json();

    if (!data.success) {
      logSuccess('Invalid OTP correctly rejected!');
      logInfo(`Error message: ${data.message}`);
      return true;
    } else {
      logError('Invalid OTP was accepted (should have been rejected)');
      return false;
    }
  } catch (error) {
    logError(`Error testing invalid OTP: ${error.message}`);
    return false;
  }
}

async function testExpiredOTP() {
  logStep(5, 'Testing expired OTP (wait 10+ minutes)...');
  logWarning('This test requires waiting 10+ minutes for OTP to expire');
  logInfo('Skipping this test for now...');
  return true;
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'bright');
  log('🧪 Email OTP Verification - Test Suite', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  logInfo('Test User Information:');
  console.log(JSON.stringify(testUser, null, 2));
  
  logWarning('\nIMPORTANT: Make sure your server is running on http://localhost:5001\n');

  // Test 1: Send OTP
  const step1Success = await sendOTP();
  if (!step1Success) {
    logError('\n❌ Test suite failed at Step 1');
    return;
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Test invalid OTP
  const step4Success = await testInvalidOTP();
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Resend OTP
  const step3Success = await resendOTP();
  
  // Now prompt for actual OTP
  log('\n' + '='.repeat(60), 'bright');
  logWarning('Please check your email (or server console) for the OTP code');
  logInfo('Copy the 6-digit OTP and run:');
  log(`node test-email-otp.js verify YOUR_OTP_CODE\n`, 'bright');
  log('='.repeat(60) + '\n', 'bright');
}

async function runVerifyTest(otp) {
  log('\n' + '='.repeat(60), 'bright');
  log('🧪 Verifying OTP: ' + otp, 'bright');
  log('='.repeat(60) + '\n', 'bright');

  const success = await verifyOTP(otp);
  
  if (success) {
    log('\n' + '='.repeat(60), 'bright');
    logSuccess('✅ All tests passed!');
    log('='.repeat(60) + '\n', 'bright');
  } else {
    log('\n' + '='.repeat(60), 'bright');
    logError('❌ Verification failed!');
    log('='.repeat(60) + '\n', 'bright');
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length > 0 && args[0] === 'verify') {
  if (args.length < 2) {
    logError('Please provide OTP code: node test-email-otp.js verify YOUR_OTP_CODE');
    process.exit(1);
  }
  runVerifyTest(args[1]);
} else {
  runAllTests();
}




