const nodemailer = require('nodemailer');

// ─── Transporter factory ─────────────────────────────────────────────────────
// Priority: Resend API → Brevo SMTP → Gmail SMTP → null (no email)
const createTransporter = () => {
  // Option 1: Resend (best for cloud — works from any server IP)
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
      }
    });
  }

  // Option 2: Brevo SMTP (also cloud-friendly)
  if (process.env.BREVO_SMTP_KEY) {
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.BREVO_SMTP_KEY
      }
    });
  }

  // Option 3: Gmail (works locally, may be blocked on cloud)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false }
    });
  }

  console.log('⚠️  No email provider configured.');
  return null;
};

// ─── Get sender address ───────────────────────────────────────────────────────
const getSender = () => {
  // Resend requires a verified domain — use onboarding@resend.dev for testing
  if (process.env.RESEND_API_KEY) {
    return process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  }
  return `"Smart Restro" <${process.env.EMAIL_USER}>`;
};

// ─── Send credentials email ───────────────────────────────────────────────────
const sendUserCredentials = async (userEmail, username, password, role) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log(`📋 Manual credentials — ${userEmail}: ${username} / ${password}`);
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

    const result = await transporter.sendMail({
      from: getSender(),
      to: userEmail,
      subject: 'Smart Restro - Your Login Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Smart Restro</h1>
            <p style="margin: 5px 0 0 0;">Restaurant Management System</p>
          </div>
          <div style="background-color: white; padding: 30px; border: 2px solid #059669; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Your Account Has Been Created!</h2>
            <div style="background-color: #f0f9ff; border: 2px solid #059669; padding: 25px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #059669; text-align: center;">🔐 YOUR LOGIN CREDENTIALS</h3>
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p style="margin:0;"><strong>👤 Username:</strong></p>
                <p style="font-size: 20px; font-weight: bold; color: #059669; font-family: monospace; margin: 5px 0 0 0;">${username}</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p style="margin:0;"><strong>🔑 Password:</strong></p>
                <p style="font-size: 20px; font-weight: bold; color: #059669; font-family: monospace; margin: 5px 0 0 0;">${password}</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p style="margin:0;"><strong>👔 Role:</strong></p>
                <p style="font-size: 18px; font-weight: bold; color: #059669; margin: 5px 0 0 0;">${roleDisplayName}</p>
              </div>
            </div>
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>📝 How to login:</strong><br>
                1. Go to the Smart Restro login page<br>
                2. Select your role: <strong>${roleDisplayName}</strong><br>
                3. Enter your username and password above<br>
                4. Click "Sign In"
              </p>
            </div>
          </div>
        </div>
      `
    });

    console.log('✅ Credentials email sent:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Email failed:', error.message);
    return {
      success: false,
      error: error.message,
      manualCredentials: { username, password, role }
    };
  }
};

// ─── Send password reset email ────────────────────────────────────────────────
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`📧 Reset link for ${email}: ${resetUrl}`);
      return { success: false, error: 'Email not configured' };
    }

    await transporter.sendMail({
      from: getSender(),
      to: email,
      subject: 'Smart Restro - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Smart Restro</h1>
          </div>
          <div style="background-color: white; padding: 30px; border: 2px solid #059669; border-top: none; border-radius: 0 0 10px 10px;">
            <h2>Hi ${name},</h2>
            <p>You requested a password reset. Click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 13px;">This link expires in 1 hour.</p>
          </div>
        </div>
      `
    });
    return { success: true };
  } catch (err) {
    console.error('Password reset email failed:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendCredentialsEmail: sendUserCredentials,
  sendUserCredentials,
  sendPasswordResetEmail,
};
