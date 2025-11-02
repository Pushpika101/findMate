// Mock email service for testing (no real emails sent)
const nodemailer = require('nodemailer');

console.log('⚠️  Email service disabled - Using mock transporter for testing');

// Create a mock transporter that doesn't actually send emails
const transporter = {
  verify: (callback) => {
    console.log('✅ Mock email server ready (no emails will be sent)');
    callback(null, true);
  },
  sendMail: async (mailOptions) => {
    console.log('📧 Mock email would be sent to:', mailOptions.to);
    console.log('📧 Subject:', mailOptions.subject);
    return { messageId: 'mock-message-id' };
  }
};

// Send verification email (mock)
const sendVerificationEmail = async (email, name, token) => {
  console.log(`
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    📧 VERIFICATION EMAIL (Mock - Not Actually Sent)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    To: ${email}
    Name: ${name}
    Token: ${token}
    
    ⚠️  For testing: Manually verify user in database:
    UPDATE users SET is_verified = true WHERE email = '${email}';
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
  return true;
};

// Send password reset email (mock)
const sendPasswordResetEmail = async (email, name, token) => {
  console.log(`
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    📧 PASSWORD RESET EMAIL (Mock - Not Actually Sent)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    To: ${email}
    Name: ${name}
    Token: ${token}
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
  return true;
};

// Send notification email (mock)
const sendNotificationEmail = async (email, subject, message) => {
  console.log(`
    📧 Notification Email (Mock):
    To: ${email}
    Subject: ${subject}
    Message: ${message}
  `);
  return true;
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail
};