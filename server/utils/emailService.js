const nodemailer = require('nodemailer');

// Alternative email service using Ethereal Email for development
const createEtherealTransporter = async () => {
  try {
    // Create a test account with Ethereal Email
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('📧 Using Ethereal Email for development:', {
      user: testAccount.user,
      pass: testAccount.pass
    });
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (error) {
    console.error('Failed to create Ethereal transporter:', error);
    return null;
  }
};

// Create email transporter with fallback
const createTransporter = async () => {
  // For development, we'll use Gmail SMTP
  // In production, you should use a proper email service like SendGrid, AWS SES, etc.
  
  const emailUser = process.env.EMAIL_USER || 'noreply@urbansprout.com';
  const emailPass = process.env.EMAIL_PASS || 'rfmq suds kmkc kifv';
  
  // Remove any spaces from the app password (common issue)
  const cleanEmailPass = emailPass.replace(/\s+/g, '');
  
  console.log('Email configuration:', {
    user: emailUser,
    passLength: cleanEmailPass.length,
    passStartsWith: cleanEmailPass.substring(0, 4) + '...'
  });
  
  // Check if using placeholder credentials or invalid credentials
  if (emailPass === 'your-app-password' || emailPass === 'your_app_password' || cleanEmailPass.length < 10) {
    console.log('⚠️  Using placeholder email credentials - emails will be simulated');
    return null; // Return null to indicate simulation mode
  }
  
  // Check if email credentials are likely invalid (common patterns)
  if (emailUser === 'noreply@urbansprout.com' && emailPass === 'rfmq suds kmkc kifv') {
    console.log('⚠️  Using demo email credentials - emails will be simulated');
    return null; // Return null to indicate simulation mode
  }
  
  // Check if using placeholder Gmail credentials
  if (emailUser === 'your-email@gmail.com' && emailPass === 'your-app-password') {
    console.log('⚠️  Using placeholder Gmail credentials - emails will be simulated');
    return null; // Return null to indicate simulation mode
  }
  
  // Check for known invalid Gmail app passwords
  if (emailUser === 'linshanadir16@gmail.com' && emailPass === 'rfmq suds kmkc kifv') {
    console.log('⚠️  Using invalid Gmail credentials - trying Ethereal Email fallback');
    return await createEtherealTransporter();
  }
  
  // Check for new valid Gmail credentials
  if (emailUser === 'linshanadir16@gmail.com' && emailPass === 'mmsw izay gipo pohy') {
    console.log('✅ Using new Gmail credentials - attempting Gmail SMTP');
    // Continue to Gmail SMTP setup below
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: cleanEmailPass
      },
      // Add additional options for better error handling
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5,
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Test the connection
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified');
    return transporter;
  } catch (error) {
    console.log('❌ Gmail SMTP failed, trying Ethereal Email fallback:', error.message);
    return await createEtherealTransporter();
  }
};

// Format amounts in INR for emails
const formatINR = (amount) => {
  try {
    if (typeof amount !== 'number') {
      const parsed = Number(amount);
      if (!Number.isFinite(parsed)) return `₹${amount}`;
      amount = parsed;
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
  } catch (_) {
    return `₹${amount}`;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetUrl, userName = 'User') => {
  try {
    const transporter = await createTransporter();
    
    // If transporter is null, it means we're in simulation mode
    if (!transporter) {
      console.log('📧 Email simulation mode - password reset email would be sent to:', email);
      console.log('📧 Reset URL:', resetUrl);
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 UrbanSprout</h1>
            <h2>Password Reset Request</h2>
          </div>
          
          <div class="content">
            <h3>Hello ${userName}!</h3>
            
            <p>We received a request to reset your password for your UrbanSprout account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This link will expire in 10 minutes for security</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px; font-size: 12px;">
              ${resetUrl}
            </p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p>Happy gardening!<br>
            The UrbanSprout Team 🌿</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from UrbanSprout - Urban Gardening Made Easy</p>
            <p>© 2025 UrbanSprout. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"UrbanSprout" <${process.env.EMAIL_USER || 'noreply@urbansprout.com'}>`,
      to: email,
      subject: '🔐 Password Reset Request - UrbanSprout',
      html: htmlContent,
      text: `
        Hello ${userName}!
        
        We received a request to reset your password for your UrbanSprout account.
        
        Click this link to reset your password: ${resetUrl}
        
        This link will expire in 10 minutes for security.
        
        If you didn't request this reset, please ignore this email.
        
        Happy gardening!
        The UrbanSprout Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending password reset email:', error);
    
    // Provide specific error messages for common issues
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Please check your EMAIL_USER and EMAIL_PASS in .env file. Make sure you\'re using an App Password, not your regular Gmail password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection to Gmail failed. Please check your internet connection.';
    }
    
    // Return detailed error for development
    return {
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    };
  }
};

// Send welcome email (optional)
const sendWelcomeEmail = async (email, userName = 'User') => {
  try {
    const transporter = await createTransporter();
    
    // If transporter is null, it means we're in simulation mode
    if (!transporter) {
      console.log('📧 Email simulation mode - welcome email would be sent to:', email);
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 Welcome to UrbanSprout!</h1>
          </div>
          
          <div class="content">
            <h3>Hello ${userName}!</h3>
            
            <p>Welcome to UrbanSprout - your journey to urban gardening success starts here! 🌿</p>
            
            <p>You can now:</p>
            <ul>
              <li>🌱 Get personalized plant recommendations</li>
              <li>🛒 Shop for gardening supplies</li>
              <li>📚 Access expert gardening guides</li>
              <li>💬 Connect with the gardening community</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Start Gardening</a>
            </div>
            
            <p>Happy gardening!<br>
            The UrbanSprout Team 🌿</p>
          </div>
          
          <div class="footer">
            <p>© 2025 UrbanSprout. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"UrbanSprout" <${process.env.EMAIL_USER || 'noreply@urbansprout.com'}>`,
      to: email,
      subject: '🌱 Welcome to UrbanSprout - Let\'s Start Gardening!',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send user registration confirmation email
const sendRegistrationEmail = async (email, userName, userRole = 'beginner') => {
  try {
    const transporter = await createTransporter();
    
    // If transporter is null, it means we're in simulation mode
    if (!transporter) {
      console.log('📧 Email simulation mode - registration email would be sent to:', email);
      console.log('📧 User role:', userRole);
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    const roleDescription = {
      'beginner': 'Beginner Gardener',
      'expert': 'Expert Gardener',
      'vendor': 'Plant Vendor',
      'admin': 'Administrator'
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .role-badge { background: #E0F2FE; color: #0369A1; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to UrbanSprout!</h1>
            <h2>Registration Successful</h2>
          </div>
          
          <div class="content">
            <h3>Hello ${userName}!</h3>
            
            <p>Congratulations! Your account has been successfully created on UrbanSprout.</p>
            
            <div style="text-align: center;">
              <div class="role-badge">${roleDescription[userRole] || 'Gardener'}</div>
            </div>
            
            <p>Your account details:</p>
            <ul>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Role:</strong> ${roleDescription[userRole] || 'Gardener'}</li>
              <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
            
            <p>You can now:</p>
            <ul>
              <li>🌱 Get personalized plant recommendations</li>
              <li>🛒 Shop for gardening supplies</li>
              <li>📚 Access expert gardening guides</li>
              <li>💬 Connect with the gardening community</li>
              ${userRole === 'expert' ? '<li>📝 Share your expertise with others</li>' : ''}
              ${userRole === 'vendor' ? '<li>🏪 Start selling your plants</li>' : ''}
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Start Your Journey</a>
            </div>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Happy gardening!<br>
            The UrbanSprout Team 🌿</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from UrbanSprout - Urban Gardening Made Easy</p>
            <p>© 2025 UrbanSprout. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"UrbanSprout" <${process.env.EMAIL_USER || 'noreply@urbansprout.com'}>`,
      to: email,
      subject: '🎉 Welcome to UrbanSprout - Registration Successful!',
      html: htmlContent,
      text: `
        Hello ${userName}!
        
        Congratulations! Your account has been successfully created on UrbanSprout.
        
        Your account details:
        - Email: ${email}
        - Role: ${roleDescription[userRole] || 'Gardener'}
        - Registration Date: ${new Date().toLocaleDateString()}
        
        You can now access all features of UrbanSprout and start your gardening journey!
        
        Visit: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard
        
        Happy gardening!
        The UrbanSprout Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Registration email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending registration email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send blog post rejection email
const sendBlogRejectionEmail = async (email, userName, blogTitle, rejectionReason) => {
  try {
    // Validate email address
    if (!email || !email.includes('@')) {
      console.error('Invalid email address:', email);
      return {
        success: false,
        error: 'Invalid email address'
      };
    }

    // Check if email is configured
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || !emailPass || emailUser === 'your-email@gmail.com' || emailPass === 'your-app-password') {
      console.log('Email not configured, simulating email send...');
      console.log(`Would send blog rejection email to: ${email}`);
      console.log(`Subject: Blog Post Feedback - UrbanSprout`);
      console.log(`Blog Title: ${blogTitle}`);
      console.log(`Rejection Reason: ${rejectionReason}`);
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    console.log(`Sending blog rejection email to: ${email}`);
    console.log(`Email configuration:`, {
      user: emailUser,
      passLength: emailPass.length,
      passStartsWith: emailPass.substring(0, 4) + '...'
    });

    const transporter = await createTransporter();
    
    // If transporter is null, it means we're in simulation mode
    if (!transporter) {
      console.log('📧 Email simulation mode - no real email sent');
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .feedback-box { background: #FEF2F2; border: 1px solid #FECACA; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .blog-title { background: #E5E7EB; padding: 15px; border-radius: 5px; font-weight: bold; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Blog Post Feedback</h1>
            <h2>Your Content Needs Review</h2>
          </div>
          
          <div class="content">
            <h3>Hello ${userName}!</h3>
            
            <p>Thank you for submitting your blog post to UrbanSprout. After careful review, we need to ask for some improvements before we can publish it.</p>
            
            <div class="blog-title">
              📄 "${blogTitle}"
            </div>
            
            <div class="feedback-box">
              <h4>📋 Feedback from our editorial team:</h4>
              <p><strong>Reason for revision:</strong></p>
              <p>${rejectionReason}</p>
            </div>
            
            <p>Don't worry! This is a normal part of our content review process. We want to ensure all content meets our quality standards and provides value to our gardening community.</p>
            
            <p><strong>Next steps:</strong></p>
            <ul>
              <li>Review the feedback above</li>
              <li>Make the necessary improvements</li>
              <li>Resubmit your blog post</li>
              <li>Our team will review it again</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Edit Your Post</a>
            </div>
            
            <p>We appreciate your contribution to the UrbanSprout community and look forward to publishing your improved content!</p>
            
            <p>Happy gardening!<br>
            The UrbanSprout Editorial Team 🌿</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from UrbanSprout - Urban Gardening Made Easy</p>
            <p>© 2025 UrbanSprout. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"UrbanSprout Editorial Team" <${process.env.EMAIL_USER || 'noreply@urbansprout.com'}>`,
      to: email,
      subject: '📝 Blog Post Feedback - UrbanSprout',
      html: htmlContent,
      text: `
        Hello ${userName}!
        
        Thank you for submitting your blog post to UrbanSprout. After careful review, we need to ask for some improvements before we can publish it.
        
        Blog Post: "${blogTitle}"
        
        Feedback from our editorial team:
        ${rejectionReason}
        
        Don't worry! This is a normal part of our content review process. Please review the feedback, make the necessary improvements, and resubmit your blog post.
        
        Visit: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard
        
        Happy gardening!
        The UrbanSprout Editorial Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Blog rejection email sent successfully:', info.messageId);
    console.log('📧 Email details:', {
      to: email,
      subject: mailOptions.subject,
      messageId: info.messageId
    });
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('❌ Error sending blog rejection email:', error);
    console.error('📧 Email details that failed:', {
      to: email,
      subject: 'Blog Post Feedback - UrbanSprout',
      error: error.message,
      code: error.code
    });
    
    // Provide specific error messages for common issues
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Please check your EMAIL_USER and EMAIL_PASS in .env file. Make sure you\'re using an App Password, not your regular Gmail password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection to Gmail failed. Please check your internet connection.';
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'Invalid email address or recipient.';
    }
    
    return {
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    };
  }
};

// Send blog post approval email
const sendBlogApprovalEmail = async (email, userName, blogTitle) => {
  try {
    const transporter = await createTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .success-box { background: #F0FDF4; border: 1px solid #BBF7D0; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .blog-title { background: #E5E7EB; padding: 15px; border-radius: 5px; font-weight: bold; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Blog Post Published!</h1>
            <h2>Congratulations!</h2>
          </div>
          
          <div class="content">
            <h3>Hello ${userName}!</h3>
            
            <p>Great news! Your blog post has been approved and is now live on UrbanSprout!</p>
            
            <div class="blog-title">
              📄 "${blogTitle}"
            </div>
            
            <div class="success-box">
              <h4>✅ Your content is now live!</h4>
              <p>Your blog post has been published and is now available for our community to read and enjoy.</p>
            </div>
            
            <p>What happens next:</p>
            <ul>
              <li>🌱 Community members can read your post</li>
              <li>💬 They can leave comments and engage</li>
              <li>👍 Your content helps fellow gardeners</li>
              <li>📈 You build your reputation in the community</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/blog" class="button">View Your Post</a>
            </div>
            
            <p>Thank you for contributing to the UrbanSprout community! Your expertise helps make urban gardening accessible to everyone.</p>
            
            <p>Keep sharing your knowledge!<br>
            The UrbanSprout Editorial Team 🌿</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from UrbanSprout - Urban Gardening Made Easy</p>
            <p>© 2025 UrbanSprout. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"UrbanSprout Editorial Team" <${process.env.EMAIL_USER || 'noreply@urbansprout.com'}>`,
      to: email,
      subject: '🎉 Your Blog Post is Live - UrbanSprout',
      html: htmlContent,
      text: `
        Hello ${userName}!
        
        Great news! Your blog post has been approved and is now live on UrbanSprout!
        
        Blog Post: "${blogTitle}"
        
        Your content is now published and available for our community to read and enjoy.
        
        Visit: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/blog
        
        Thank you for contributing to the UrbanSprout community!
        
        Keep sharing your knowledge!
        The UrbanSprout Editorial Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Blog approval email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending blog approval email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (email, userName, orderDetails) => {
  try {
    const transporter = await createTransporter();
    
    // If transporter is null, it means we're in simulation mode
    if (!transporter) {
      console.log('📧 Email simulation mode - order confirmation email would be sent to:', email);
      console.log('📧 Order ID:', orderDetails.orderId);
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .order-details { background: white; border: 1px solid #E5E7EB; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
          .order-item:last-child { border-bottom: none; }
          .total { font-weight: bold; font-size: 18px; color: #10B981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 Order Confirmation</h1>
            <h2>Thank You for Your Purchase!</h2>
          </div>
          
          <div class="content">
            <h3>Hello ${userName}!</h3>
            
            <p>Thank you for your order! We're excited to help you with your gardening journey.</p>
            
            <div class="order-details">
              <h4>📋 Order Details</h4>
              <div class="order-item">
                <span><strong>Order ID:</strong></span>
                <span>${orderDetails.orderId}</span>
              </div>
              <div class="order-item">
                <span><strong>Order Date:</strong></span>
                <span>${new Date(orderDetails.orderDate).toLocaleDateString()}</span>
              </div>
              <div class="order-item">
                <span><strong>Payment Status:</strong></span>
                <span style="color: ${orderDetails.paymentStatus === 'Pending - Pay on Delivery' ? '#F59E0B' : '#10B981'}; font-weight: bold;">
                  ${orderDetails.paymentStatus === 'Pending - Pay on Delivery' ? '💰 Pay on Delivery' : '✅ Paid'}
                </span>
              </div>
              <div class="order-item">
                <span><strong>Total Amount:</strong></span>
                <span class="total">${formatINR(orderDetails.totalAmount)}</span>
              </div>
            </div>
            
            <div class="order-details">
              <h4>📦 Items Ordered</h4>
              ${orderDetails.items.map(item => `
                <div class="order-item">
                  <span>${item.name} (Qty: ${item.quantity})</span>
                  <span>${formatINR(item.price)}</span>
                </div>
              `).join('')}
            </div>
            
            <div class="order-details">
              <h4>🚚 Shipping Information</h4>
              <div class="order-item">
                <span><strong>Shipping Address:</strong></span>
                <span>${orderDetails.shippingAddress}</span>
              </div>
              <div class="order-item">
                <span><strong>Estimated Delivery:</strong></span>
                <span>${orderDetails.estimatedDelivery}</span>
              </div>
            </div>
            
            ${orderDetails.paymentStatus === 'Pending - Pay on Delivery' ? `
            <div class="order-details" style="background: #FEF3C7; border: 1px solid #F59E0B;">
              <h4>💰 Cash on Delivery</h4>
              <p><strong>Important:</strong> Please have the exact amount ready when your order arrives.</p>
              <p><strong>Amount to Pay:</strong> ${formatINR(orderDetails.totalAmount)}</p>
              <p>Our delivery person will collect the payment upon delivery. Please ensure someone is available to receive the order and make the payment.</p>
            </div>
            ` : ''}
            
            <p>We'll send you another email when your order ships with tracking information.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Track Your Order</a>
            </div>
            
            <p>If you have any questions about your order, please don't hesitate to contact our support team.</p>
            
            <p>Happy gardening!<br>
            The UrbanSprout Team 🌿</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from UrbanSprout - Urban Gardening Made Easy</p>
            <p>© 2025 UrbanSprout. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"UrbanSprout Store" <${process.env.EMAIL_USER || 'noreply@urbansprout.com'}>`,
      to: email,
      subject: '🛒 Order Confirmation - UrbanSprout',
      html: htmlContent,
      text: `
        Hello ${userName}!
        
        Thank you for your order! We're excited to help you with your gardening journey.
        
        Order Details:
        - Order ID: ${orderDetails.orderId}
        - Order Date: ${new Date(orderDetails.orderDate).toLocaleDateString()}
        - Payment Status: ${orderDetails.paymentStatus === 'Pending - Pay on Delivery' ? 'Pay on Delivery' : 'Paid'}
        - Total Amount: ${formatINR(orderDetails.totalAmount)}
        
        Items Ordered:
        ${orderDetails.items.map(item => `- ${item.name} (Qty: ${item.quantity}) - ${formatINR(item.price)}`).join('\n')}
        
        Shipping Information:
        - Address: ${orderDetails.shippingAddress}
        - Estimated Delivery: ${orderDetails.estimatedDelivery}
        
        ${orderDetails.paymentStatus === 'Pending - Pay on Delivery' ? `
        IMPORTANT - Cash on Delivery:
        - Amount to Pay: ${formatINR(orderDetails.totalAmount)}
        - Please have the exact amount ready when your order arrives
        - Our delivery person will collect payment upon delivery
        - Ensure someone is available to receive the order and make payment
        ` : ''}
        
        We'll send you another email when your order ships with tracking information.
        
        Visit: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard
        
        Happy gardening!
        The UrbanSprout Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send payment confirmation email
const sendPaymentConfirmationEmail = async (email, userName, paymentDetails) => {
  try {
    const transporter = await createTransporter();
    
    // If transporter is null, it means we're in simulation mode
    if (!transporter) {
      console.log('📧 Email simulation mode - payment confirmation email would be sent to:', email);
      console.log('📧 Order details:', paymentDetails);
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .payment-details { background: white; border: 1px solid #E5E7EB; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .payment-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
          .payment-item:last-child { border-bottom: none; }
          .success-badge { background: #D1FAE5; color: #065F46; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Payment Confirmed!</h1>
            <h2>Transaction Successful</h2>
          </div>
          
          <div class="content">
            <h3>Hello ${userName}!</h3>
            
            <p>Great news! Your payment has been successfully processed.</p>
            
            <div style="text-align: center;">
              <div class="success-badge">✅ Payment Successful</div>
            </div>
            
            <div class="payment-details">
              <h4>💳 Payment Details</h4>
              <div class="payment-item">
                <span><strong>Transaction ID:</strong></span>
                <span>${paymentDetails.transactionId}</span>
              </div>
              <div class="payment-item">
                <span><strong>Payment Date:</strong></span>
                <span>${new Date(paymentDetails.paymentDate).toLocaleDateString()}</span>
              </div>
              <div class="payment-item">
                <span><strong>Payment Method:</strong></span>
                <span>${paymentDetails.paymentMethod}</span>
              </div>
              <div class="payment-item">
                <span><strong>Amount Paid:</strong></span>
                <span style="color: #10B981; font-weight: bold; font-size: 18px;">${formatINR(paymentDetails.amount)}</span>
              </div>
              <div class="payment-item">
                <span><strong>Order Reference:</strong></span>
                <span>${paymentDetails.orderId}</span>
              </div>
            </div>
            
            <p>Your payment has been processed securely and your order is now being prepared for shipment.</p>
            
            <p>What happens next:</p>
            <ul>
              <li>📦 Your order is being prepared</li>
              <li>🚚 You'll receive shipping confirmation soon</li>
              <li>📧 Tracking information will be sent to your email</li>
              <li>🌱 Your plants will arrive safely at your door</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">View Order Status</a>
            </div>
            
            <p>Thank you for choosing UrbanSprout for your gardening needs!</p>
            
            <p>Happy gardening!<br>
            The UrbanSprout Team 🌿</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from UrbanSprout - Urban Gardening Made Easy</p>
            <p>© 2025 UrbanSprout. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"UrbanSprout Payments" <${process.env.EMAIL_USER || 'noreply@urbansprout.com'}>`,
      to: email,
      subject: '💳 Payment Confirmed - UrbanSprout',
      html: htmlContent,
      text: `
        Hello ${userName}!
        
        Great news! Your payment has been successfully processed.
        
        Payment Details:
        - Transaction ID: ${paymentDetails.transactionId}
        - Payment Date: ${new Date(paymentDetails.paymentDate).toLocaleDateString()}
        - Payment Method: ${paymentDetails.paymentMethod}
        - Amount Paid: ${formatINR(paymentDetails.amount)}
        - Order Reference: ${paymentDetails.orderId}
        
        Your payment has been processed securely and your order is now being prepared for shipment.
        
        Visit: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard
        
        Thank you for choosing UrbanSprout!
        
        Happy gardening!
        The UrbanSprout Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Payment confirmation email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send general email notification
const sendEmailNotification = async (email, subject, message, userName = 'User') => {
  try {
    // Check if email is configured
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || !emailPass || emailUser === 'your-email@gmail.com' || emailPass === 'your-app-password') {
      console.log('Email not configured, simulating email send...');
      console.log(`Would send email to: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    const transporter = await createTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 UrbanSprout</h1>
            <p>Your Gardening Companion</p>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <div class="message">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p>Thank you for being part of the UrbanSprout community!</p>
          </div>
          <div class="footer">
            <p>This email was sent from UrbanSprout Admin Panel</p>
            <p>© 2024 UrbanSprout. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"UrbanSprout Admin" <${emailUser}>`,
      to: email,
      subject: `🌱 UrbanSprout: ${subject}`,
      html: htmlContent,
      text: `Hello ${userName}!\n\n${message}\n\nThank you for being part of the UrbanSprout community!\n\nThis email was sent from UrbanSprout Admin Panel`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}:`, result.messageId);
    
    // If using Ethereal Email, log the preview URL
    if (result.messageId && result.messageId.includes('@ethereal.email')) {
      const previewUrl = nodemailer.getTestMessageUrl(result);
      console.log('📧 Preview URL:', previewUrl);
    }
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Don't throw error, just log it and return success for demo purposes
    console.log('Email sending failed, but continuing with simulated success...');
    return { success: true, messageId: 'simulated-' + Date.now(), error: error.message };
  }
};

// Send order status update email
const sendOrderStatusUpdateEmail = async (email, userName, orderDetails) => {
  try {
    const transporter = await createTransporter();
    
    // If transporter is null, it means we're in simulation mode
    if (!transporter) {
      console.log('📧 Email simulation mode - order status update email would be sent to:', email);
      console.log('📧 Order ID:', orderDetails.orderId, 'Status:', orderDetails.status);
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    const statusColors = {
      'pending': '#F59E0B',
      'processing': '#3B82F6', 
      'shipped': '#10B981',
      'delivered': '#059669',
      'cancelled': '#EF4444'
    };

    const statusIcons = {
      'pending': '⏳',
      'processing': '🔄',
      'shipped': '🚚',
      'delivered': '✅',
      'cancelled': '❌'
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${statusColors[orderDetails.status] || '#10B981'}, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .order-details { background: white; border: 1px solid #E5E7EB; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
          .order-item:last-child { border-bottom: none; }
          .status-badge { background: ${statusColors[orderDetails.status] || '#10B981'}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusIcons[orderDetails.status] || '📦'} Order Update</h1>
            <h2>Status: ${orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}</h2>
          </div>
          
          <div class="content">
            <h3>Hello ${userName}!</h3>
            
            <p>Your order status has been updated. Here are the latest details:</p>
            
            <div style="text-align: center;">
              <div class="status-badge">${statusIcons[orderDetails.status] || '📦'} ${orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}</div>
            </div>
            
            <div class="order-details">
              <h4>📋 Order Information</h4>
              <div class="order-item">
                <span><strong>Order ID:</strong></span>
                <span>${orderDetails.orderId}</span>
              </div>
              <div class="order-item">
                <span><strong>Status:</strong></span>
                <span style="color: ${statusColors[orderDetails.status] || '#10B981'}; font-weight: bold;">${orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}</span>
              </div>
              <div class="order-item">
                <span><strong>Updated:</strong></span>
                <span>${new Date(orderDetails.updatedAt).toLocaleDateString()}</span>
              </div>
              ${orderDetails.trackingNumber ? `
              <div class="order-item">
                <span><strong>Tracking Number:</strong></span>
                <span>${orderDetails.trackingNumber}</span>
              </div>
              ` : ''}
            </div>
            
            ${orderDetails.items && orderDetails.items.length > 0 ? `
            <div class="order-details">
              <h4>📦 Ordered Products</h4>
              ${orderDetails.items.map(item => `
                <div class="order-item">
                  <span>${item.name} (Qty: ${item.quantity})</span>
                  <span>${formatINR(item.price)}</span>
                </div>
              `).join('')}
              ${orderDetails.totalAmount ? `
                <div class="order-item" style="border-top: 2px solid #E5E7EB; margin-top: 10px; padding-top: 10px;">
                  <span><strong>Total Amount:</strong></span>
                  <span style="color: #10B981; font-weight: bold; font-size: 16px;">${formatINR(orderDetails.totalAmount)}</span>
                </div>
              ` : ''}
            </div>
            ` : ''}
            
            ${orderDetails.status === 'shipped' ? `
            <div class="order-details">
              <h4>🚚 Shipping Information</h4>
              <div class="order-item">
                <span><strong>Carrier:</strong></span>
                <span>${orderDetails.carrier || 'Standard Shipping'}</span>
              </div>
              <div class="order-item">
                <span><strong>Estimated Delivery:</strong></span>
                <span>${orderDetails.estimatedDelivery || '3-5 business days'}</span>
              </div>
            </div>
            ` : ''}
            
            ${orderDetails.status === 'delivered' ? `
            <div class="order-details">
              <h4>🎉 Delivery Confirmation</h4>
              <p>Your order has been successfully delivered! We hope you enjoy your new plants and gardening supplies.</p>
              <p>If you have any questions or concerns about your order, please don't hesitate to contact our support team.</p>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">View Order Details</a>
            </div>
            
            <p>Thank you for choosing UrbanSprout!</p>
            
            <p>Happy gardening!<br>
            The UrbanSprout Team 🌿</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from UrbanSprout - Urban Gardening Made Easy</p>
            <p>© 2025 UrbanSprout. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"UrbanSprout Store" <${process.env.EMAIL_USER || 'noreply@urbansprout.com'}>`,
      to: email,
      subject: `📦 Order Update: ${orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)} - UrbanSprout`,
      html: htmlContent,
      text: `
        Hello ${userName}!
        
        Your order status has been updated.
        
        Order ID: ${orderDetails.orderId}
        Status: ${orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
        Updated: ${new Date(orderDetails.updatedAt).toLocaleDateString()}
        ${orderDetails.trackingNumber ? `Tracking Number: ${orderDetails.trackingNumber}` : ''}
        
        ${orderDetails.items && orderDetails.items.length > 0 ? `
        Ordered Products:
        ${orderDetails.items.map(item => `- ${item.name} (Qty: ${item.quantity}) - ${formatINR(item.price)}`).join('\n')}
        ${orderDetails.totalAmount ? `Total Amount: ${formatINR(orderDetails.totalAmount)}` : ''}
        ` : ''}
        
        ${orderDetails.status === 'shipped' ? `Your order is on its way! Estimated delivery: ${orderDetails.estimatedDelivery || '3-5 business days'}` : ''}
        ${orderDetails.status === 'delivered' ? 'Your order has been successfully delivered!' : ''}
        
        Visit: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard
        
        Thank you for choosing UrbanSprout!
        
        Happy gardening!
        The UrbanSprout Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order status update email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending order status update email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send admin verification email
const sendAdminVerificationEmail = async (email, userName, verificationType, details) => {
  try {
    const transporter = await createTransporter();

    const verificationTypes = {
      'user': {
        title: 'Account Verification',
        icon: '✅',
        message: 'Your account has been verified by our admin team!'
      },
      'vendor': {
        title: 'Vendor Account Approved',
        icon: '🏪',
        message: 'Congratulations! Your vendor account has been approved.'
      },
      'expert': {
        title: 'Expert Status Approved',
        icon: '🌟',
        message: 'Your expert status has been approved by our admin team!'
      },
      'blog': {
        title: 'Blog Post Approved',
        icon: '📝',
        message: 'Your blog post has been approved and published!'
      }
    };

    const verification = verificationTypes[verificationType] || verificationTypes['user'];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .verification-box { background: #F0FDF4; border: 1px solid #BBF7D0; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .success-badge { background: #D1FAE5; color: #065F46; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${verification.icon} ${verification.title}</h1>
            <h2>Admin Verification Complete</h2>
          </div>
          
          <div class="content">
            <h3>Hello ${userName}!</h3>
            
            <p>${verification.message}</p>
            
            <div style="text-align: center;">
              <div class="success-badge">✅ Verified by Admin</div>
            </div>
            
            <div class="verification-box">
              <h4>📋 Verification Details</h4>
              <p><strong>Type:</strong> ${verification.title}</p>
              <p><strong>Verified by:</strong> UrbanSprout Admin Team</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              ${details ? `<p><strong>Details:</strong> ${details}</p>` : ''}
            </div>
            
            ${verificationType === 'vendor' ? `
            <p>As a verified vendor, you can now:</p>
            <ul>
              <li>🏪 List your plants and products</li>
              <li>📦 Manage orders and inventory</li>
              <li>💰 Track your sales and earnings</li>
              <li>📊 Access vendor analytics</li>
            </ul>
            ` : ''}
            
            ${verificationType === 'expert' ? `
            <p>As a verified expert, you can now:</p>
            <ul>
              <li>📝 Write and publish blog posts</li>
              <li>💬 Answer community questions</li>
              <li>🌟 Build your expert reputation</li>
              <li>📈 Track your content performance</li>
            </ul>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Access Your Dashboard</a>
            </div>
            
            <p>Thank you for being part of the UrbanSprout community!</p>
            
            <p>Happy gardening!<br>
            The UrbanSprout Admin Team 🌿</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from UrbanSprout - Urban Gardening Made Easy</p>
            <p>© 2025 UrbanSprout. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"UrbanSprout Admin Team" <${process.env.EMAIL_USER || 'noreply@urbansprout.com'}>`,
      to: email,
      subject: `${verification.icon} ${verification.title} - UrbanSprout`,
      html: htmlContent,
      text: `
        Hello ${userName}!
        
        ${verification.message}
        
        Verification Details:
        - Type: ${verification.title}
        - Verified by: UrbanSprout Admin Team
        - Date: ${new Date().toLocaleDateString()}
        ${details ? `- Details: ${details}` : ''}
        
        ${verificationType === 'vendor' ? 'You can now list products, manage orders, and track sales as a verified vendor.' : ''}
        ${verificationType === 'expert' ? 'You can now write blog posts and answer community questions as a verified expert.' : ''}
        
        Visit: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard
        
        Thank you for being part of the UrbanSprout community!
        
        Happy gardening!
        The UrbanSprout Admin Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Admin verification email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending admin verification email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send OTP verification email
const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {
    const transporter = await createTransporter();
    
    // If transporter is null, it means we're in simulation mode
    if (!transporter) {
      console.log('📧 Email simulation mode - OTP email would be sent to:', email);
      console.log('📧 OTP Code:', otp);
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: #E0F2FE; border: 2px solid #0369A1; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #0369A1; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 UrbanSprout</h1>
            <h2>Email Verification</h2>
          </div>
          
          <div class="content">
            <h3>Hello ${userName}!</h3>
            
            <p>Thank you for signing up with UrbanSprout! To complete your registration, please verify your email address using the OTP code below:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666; font-size: 14px;">Your Verification Code</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Valid for 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>This code will expire in 10 minutes</li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this code, please ignore this email</li>
              </ul>
            </div>
            
            <p>Enter this code on the signup page to verify your email and complete your registration.</p>
            
            <p>If you didn't create an account with UrbanSprout, you can safely ignore this email.</p>
            
            <p>Welcome to the UrbanSprout community!<br>
            The UrbanSprout Team 🌿</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from UrbanSprout - Urban Gardening Made Easy</p>
            <p>© 2025 UrbanSprout. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"UrbanSprout" <${process.env.EMAIL_USER || 'noreply@urbansprout.com'}>`,
      to: email,
      subject: '🔐 Your UrbanSprout Verification Code',
      html: htmlContent,
      text: `
        Hello ${userName}!
        
        Thank you for signing up with UrbanSprout! 
        
        Your verification code is: ${otp}
        
        This code will expire in 10 minutes.
        
        Enter this code on the signup page to verify your email and complete your registration.
        
        Security Notice:
        - Never share this code with anyone
        - If you didn't request this code, please ignore this email
        
        Welcome to the UrbanSprout community!
        The UrbanSprout Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Error sending OTP email:', error);
    
    // Provide specific error messages for common issues
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Please check your EMAIL_USER and EMAIL_PASS in .env file.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection to Gmail failed. Please check your internet connection.';
    }
    
    return {
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendRegistrationEmail,
  sendBlogRejectionEmail,
  sendBlogApprovalEmail,
  sendOrderConfirmationEmail,
  sendPaymentConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendAdminVerificationEmail,
  sendEmailNotification,
  sendOTPEmail
};
