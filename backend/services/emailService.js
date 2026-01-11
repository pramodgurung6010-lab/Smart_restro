const nodemailer = require('nodemailer');

// Create transporter for Gmail
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
      process.env.EMAIL_USER === 'your-email@gmail.com' || 
      process.env.EMAIL_PASS === 'your-app-password' ||
      process.env.EMAIL_PASS === 'your_16_character_app_password_here' ||
      process.env.EMAIL_PASS === 'PASTE_YOUR_16_CHAR_APP_PASSWORD_HERE') {
    console.log('⚠️  Email not configured. Users will be created but no email will be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use App Password for Gmail
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send user credentials via email
const sendUserCredentials = async (userEmail, username, password, role) => {
  try {
    const transporter = createTransporter();
    
    // If no transporter (email not configured), return graceful message
    if (!transporter) {
      console.log('📧 Email not configured - User created successfully but no email sent');
      console.log(`📋 Manual credentials for ${userEmail}:`);
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${role}`);
      return { 
        success: false, 
        error: 'Email not configured',
        manualCredentials: { username, password, role }
      };
    }
    
    const roleDisplayName = {
      'ADMIN': 'Administrator',
      'WAITER': 'Waiter/Staff',
      'KITCHEN': 'Kitchen Staff'
    }[role] || role;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Smart Restro - Your Login Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Smart Restro</h1>
            <p style="margin: 5px 0 0 0;">Restaurant Management System</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border: 2px solid #059669; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Your Account Has Been Created!</h2>
            
            <div style="background-color: #f0f9ff; border: 2px solid #059669; padding: 25px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #059669; margin: 0 0 20px 0; text-align: center; font-size: 20px;">🔐 YOUR LOGIN CREDENTIALS</h3>
              
              <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p style="margin: 0; font-size: 16px;"><strong>👤 Username:</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #059669; font-family: monospace;">${username}</p>
              </div>
              
              <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p style="margin: 0; font-size: 16px;"><strong>🔑 Password:</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #059669; font-family: monospace;">${password}</p>
              </div>
              
              <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p style="margin: 0; font-size: 16px;"><strong>👔 Role:</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #059669;">${roleDisplayName}</p>
              </div>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>📝 Instructions:</strong><br>
                1. Go to the Smart Restro login page<br>
                2. Select your role: ${roleDisplayName}<br>
                3. Enter your username and password above<br>
                4. Click "Sign In"
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Need help?</strong> Contact your administrator<br>
                This is an automated message from Smart Restro
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.log('📋 Manual credentials (email failed):');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    return { 
      success: false, 
      error: error.message,
      manualCredentials: { username, password, role }
    };
  }
};

module.exports = {
  sendCredentialsEmail: sendUserCredentials,
  sendUserCredentials,
};