// Email helper supporting SendGrid, SMTP (nodemailer), and a mock fallback.
const nodemailer = require('nodemailer');
require('dotenv').config();

let sendVerificationEmail;
let sendPasswordResetEmail;
let sendNotificationEmail;

// If SENDGRID_API_KEY is set, prefer SendGrid
if (process.env.SENDGRID_API_KEY) {
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    sendVerificationEmail = async (email, name, token) => {
      // Point verification link to backend so clicking the email performs verification
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
      const verifyUrl = `${backendUrl}/api/auth/verify-email?token=${token}`;
      const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        subject: 'Verify your findMate account',
        html: `<p>Hi ${name},</p>
               <p>Please verify your account by clicking <a href="${verifyUrl}">this link</a>. The link expires in 24 hours.</p>`
      };
      await sgMail.send(msg);
      return true;
    };

    sendPasswordResetEmail = async (email, name, token) => {
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
      const resetUrl = `${backendUrl}/api/auth/reset-password?token=${token}`;
      const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        subject: 'Reset your findMate password',
        html: `<p>Hi ${name},</p>
               <p>Reset your password by clicking <a href="${resetUrl}">this link</a>. The link expires in 1 hour.</p>`
      };
      await sgMail.send(msg);
      return true;
    };

    sendNotificationEmail = async (email, subject, message) => {
      const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        subject,
        html: `<p>${message}</p>`
      };
      await sgMail.send(msg);
      return true;
    };

    console.log('✅ Email: configured with SendGrid');
  } catch (err) {
    console.warn('⚠️ SendGrid module not installed or failed to initialize, falling back to SMTP/mock', err.message);
  }
}

// If no SendGrid, but SMTP details provided, use nodemailer
if (!sendVerificationEmail && process.env.SMTP_HOST) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });

    // verify transporter on startup
    transporter.verify((err, success) => {
      if (err) console.warn('⚠️ SMTP transporter verify failed:', err.message);
      else console.log('✅ SMTP transporter ready');
    });

    sendVerificationEmail = async (email, name, token) => {
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
      const verifyUrl = `${backendUrl}/api/auth/verify-email?token=${token}`;
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        to: email,
        subject: 'Verify your findMate account',
        html: `<p>Hi ${name},</p><p>Please verify your account by clicking <a href="${verifyUrl}">this link</a>. The link expires in 24 hours.</p>`
      };
      await transporter.sendMail(mailOptions);
      return true;
    };

    sendPasswordResetEmail = async (email, name, token) => {
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
      const resetUrl = `${backendUrl}/api/auth/reset-password?token=${token}`;
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        to: email,
        subject: 'Reset your findMate password',
        html: `<p>Hi ${name},</p><p>Reset your password by clicking <a href="${resetUrl}">this link</a>. The link expires in 1 hour.</p>`
      };
      await transporter.sendMail(mailOptions);
      return true;
    };

    sendNotificationEmail = async (email, subject, message) => {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        to: email,
        subject,
        html: `<p>${message}</p>`
      };
      await transporter.sendMail(mailOptions);
      return true;
    };

    console.log('✅ Email: configured with SMTP transporter');
  } catch (err) {
    console.warn('⚠️ SMTP initialization failed, falling back to mock', err.message);
  }
}

// Fallback mock implementation
if (!sendVerificationEmail) {
  console.log('⚠️  Email service not configured - Using mock transporter for testing');

  sendVerificationEmail = async (email, name, token) => {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const verifyUrl = `${backendUrl}/api/auth/verify-email?token=${token}`;
    console.log(`\n📧 VERIFICATION EMAIL (Mock)\nTo: ${email}\nName: ${name}\nToken: ${token}\nLink: ${verifyUrl}\n`);
    return true;
  };

  sendPasswordResetEmail = async (email, name, token) => {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const resetUrl = `${backendUrl}/api/auth/reset-password?token=${token}`;
    console.log(`\n📧 PASSWORD RESET EMAIL (Mock)\nTo: ${email}\nName: ${name}\nToken: ${token}\nLink: ${resetUrl}\n`);
    return true;
  };

  sendNotificationEmail = async (email, subject, message) => {
    console.log(`\n📧 Notification (Mock)\nTo: ${email}\nSubject: ${subject}\nMessage: ${message}\n`);
    return true;
  };
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail
};