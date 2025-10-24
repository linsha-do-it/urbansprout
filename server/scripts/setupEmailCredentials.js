const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEmailCredentials() {
  console.log('🌱 UrbanSprout Email Setup');
  console.log('==========================\n');
  
  console.log('This script will help you configure email credentials for UrbanSprout.');
  console.log('You can use Gmail with App Passwords or other SMTP services.\n');
  
  const emailService = await question('Choose email service (1: Gmail, 2: Other SMTP): ');
  
  let emailUser, emailPass, smtpHost = 'smtp.gmail.com', smtpPort = 587;
  
  if (emailService === '1') {
    console.log('\n📧 Gmail Setup:');
    console.log('1. Go to your Google Account settings');
    console.log('2. Enable 2-factor authentication');
    console.log('3. Generate an App Password for this application');
    console.log('4. Use your Gmail address and the generated App Password\n');
    
    emailUser = await question('Enter your Gmail address: ');
    emailPass = await question('Enter your Gmail App Password: ');
  } else {
    console.log('\n📧 Custom SMTP Setup:');
    smtpHost = await question('Enter SMTP host (e.g., smtp.gmail.com): ');
    smtpPort = await question('Enter SMTP port (e.g., 587): ');
    emailUser = await question('Enter your email address: ');
    emailPass = await question('Enter your email password/App Password: ');
  }
  
  // Read current .env file
  const envPath = path.join(__dirname, '..', '..', '.env');
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('Creating new .env file...');
  }
  
  // Update or add email configuration
  const lines = envContent.split('\n');
  const updatedLines = [];
  let emailUserFound = false;
  let emailPassFound = false;
  let smtpHostFound = false;
  let smtpPortFound = false;
  
  for (const line of lines) {
    if (line.startsWith('EMAIL_USER=')) {
      updatedLines.push(`EMAIL_USER=${emailUser}`);
      emailUserFound = true;
    } else if (line.startsWith('EMAIL_PASS=')) {
      updatedLines.push(`EMAIL_PASS=${emailPass}`);
      emailPassFound = true;
    } else if (line.startsWith('SMTP_HOST=')) {
      updatedLines.push(`SMTP_HOST=${smtpHost}`);
      smtpHostFound = true;
    } else if (line.startsWith('SMTP_PORT=')) {
      updatedLines.push(`SMTP_PORT=${smtpPort}`);
      smtpPortFound = true;
    } else if (line.trim() && !line.startsWith('#')) {
      updatedLines.push(line);
    }
  }
  
  // Add missing configurations
  if (!emailUserFound) {
    updatedLines.push(`EMAIL_USER=${emailUser}`);
  }
  if (!emailPassFound) {
    updatedLines.push(`EMAIL_PASS=${emailPass}`);
  }
  if (!smtpHostFound && emailService !== '1') {
    updatedLines.push(`SMTP_HOST=${smtpHost}`);
  }
  if (!smtpPortFound && emailService !== '1') {
    updatedLines.push(`SMTP_PORT=${smtpPort}`);
  }
  
  // Write updated .env file
  fs.writeFileSync(envPath, updatedLines.join('\n') + '\n');
  
  console.log('\n✅ Email configuration updated!');
  console.log('📧 Email User:', emailUser);
  console.log('🔐 Email Pass:', emailPass.substring(0, 4) + '...');
  if (emailService !== '1') {
    console.log('🌐 SMTP Host:', smtpHost);
    console.log('🔌 SMTP Port:', smtpPort);
  }
  
  console.log('\n🧪 Testing email configuration...');
  
  // Test email configuration
  try {
    const { sendEmailNotification } = require('../utils/emailService');
    const result = await sendEmailNotification(
      emailUser,
      'Test Email',
      'This is a test email from UrbanSprout. If you receive this, your email configuration is working correctly!',
      'Test User'
    );
    
    if (result.success) {
      console.log('✅ Email test successful! Check your inbox.');
    } else {
      console.log('❌ Email test failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Email test error:', error.message);
  }
  
  console.log('\n🚀 Restart your server to apply the new email configuration.');
  console.log('   Run: npm run dev (in the server directory)');
  
  rl.close();
}

setupEmailCredentials().catch(console.error);






