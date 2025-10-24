#!/usr/bin/env node

/**
 * Enhanced Email Service Setup Script
 * This script helps configure and test the email service with multiple providers
 */

const fs = require('fs');
const path = require('path');
const { testEmailService, EMAIL_CONFIG } = require('../utils/enhancedEmailService');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

// Check if .env file exists
const checkEnvFile = () => {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    log.error('.env file not found!');
    log.info('Creating .env file template...');
    
    const envTemplate = `# UrbanSprout Email Configuration

# Primary Email Service (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password

# SendGrid Configuration (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=your-verified-sendgrid-email@domain.com

# Fallback SMTP Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Test Email (for testing purposes)
TEST_EMAIL=test@example.com
`;
    
    fs.writeFileSync(envPath, envTemplate);
    log.success('.env file created with template!');
    log.warning('Please update the .env file with your actual email credentials.');
    return false;
  }
  return true;
};

// Validate email configuration
const validateEmailConfig = () => {
  log.header('📧 Email Configuration Validation');
  
  const issues = [];
  
  // Check Gmail configuration
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
    issues.push('EMAIL_USER not configured');
  }
  
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your-16-character-app-password') {
    issues.push('EMAIL_PASS not configured');
  } else if (process.env.EMAIL_PASS.length !== 16) {
    issues.push('EMAIL_PASS should be 16 characters (Gmail App Password)');
  }
  
  // Check SendGrid configuration
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key') {
    log.success('SendGrid API key configured');
  } else {
    log.info('SendGrid not configured (optional)');
  }
  
  if (issues.length > 0) {
    log.error('Configuration issues found:');
    issues.forEach(issue => log.error(`  - ${issue}`));
    return false;
  }
  
  log.success('Email configuration looks good!');
  return true;
};

// Test email sending
const testEmailSending = async () => {
  log.header('🧪 Testing Email Service');
  
  try {
    const result = await testEmailService();
    
    if (result.success) {
      log.success(`Email sent successfully using ${result.provider}!`);
      log.info(`Message ID: ${result.messageId}`);
    } else {
      log.error(`Email sending failed: ${result.error}`);
      if (result.details) {
        log.error('Error details:', result.details);
      }
    }
    
    return result.success;
  } catch (error) {
    log.error(`Email test failed: ${error.message}`);
    return false;
  }
};

// Display setup instructions
const displaySetupInstructions = () => {
  log.header('📋 Email Setup Instructions');
  
  console.log(`
${colors.bright}Gmail SMTP Setup:${colors.reset}
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password
4. Update your .env file:
   EMAIL_USER=your-actual-gmail@gmail.com
   EMAIL_PASS=your-16-character-app-password

${colors.bright}SendGrid Setup (Optional):${colors.reset}
1. Create a SendGrid account
2. Verify your sender identity
3. Generate an API key
4. Update your .env file:
   SENDGRID_API_KEY=your-api-key
   SENDGRID_FROM_EMAIL=your-verified-email@domain.com

${colors.bright}Testing:${colors.reset}
Run this script again after configuration to test email sending.
`);
};

// Main function
const main = async () => {
  log.header('🌱 UrbanSprout Enhanced Email Service Setup');
  
  // Check if .env exists
  if (!checkEnvFile()) {
    displaySetupInstructions();
    return;
  }
  
  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  
  // Validate configuration
  if (!validateEmailConfig()) {
    displaySetupInstructions();
    return;
  }
  
  // Test email sending
  const emailTestPassed = await testEmailSending();
  
  if (emailTestPassed) {
    log.header('🎉 Email Service Setup Complete!');
    log.success('Your email service is ready to use!');
    log.info('You can now:');
    log.info('  - Send password reset emails');
    log.info('  - Send payment confirmation emails');
    log.info('  - Send order confirmation emails');
    log.info('  - Send blog notification emails');
  } else {
    log.header('⚠️ Email Service Setup Incomplete');
    log.warning('Please check your email configuration and try again.');
    displaySetupInstructions();
  }
};

// Run the setup
if (require.main === module) {
  main().catch(error => {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkEnvFile,
  validateEmailConfig,
  testEmailSending,
  displaySetupInstructions
};
