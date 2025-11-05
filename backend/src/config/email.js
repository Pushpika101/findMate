// Email helper supporting SendGrid, SMTP (nodemailer), and a mock fallback.
const nodemailer = require('nodemailer');
require('dotenv').config();

let sendVerificationEmail;
let sendPasswordResetEmail;
let sendVerificationOtpEmail;
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
      // Also include an app deep-link so mobile clients may open directly if configured
      const appScheme = process.env.MOBILE_APP_SCHEME || 'findmate://';
      const appVerifyUrl = `${appScheme}verify-email?token=${token}`;
      const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        subject: 'Verify your findMate account',
        html: `<p>Hi ${name},</p>
               <p>Please verify your account by clicking <a href="${verifyUrl}">this link</a>. The link expires in 24 hours.</p>
               <p>If you're on mobile you can open the app directly: <a href="${appVerifyUrl}">Open in app</a></p>`
      };
      try {
        await sgMail.send(msg);
        return true;
      } catch (err) {
        console.error('SendGrid sendVerificationEmail error:', err?.response?.body || err.message || err);
        throw err;
      }
    };

    // Send OTP (numeric code) for verification
    sendVerificationOtpEmail = async (email, name, otp) => {
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
      const appScheme = process.env.MOBILE_APP_SCHEME || 'findmate://';
      const appResetUrl = `${appScheme}verify-email?otp=${otp}&email=${encodeURIComponent(email)}`;
      const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        subject: 'Your findMate verification code',
        html: `<p>Hi ${name},</p>
               <p>Your verification code is <strong>${otp}</strong>. It expires in 15 minutes.</p>
               <p>If you're on mobile you can open the app directly: <a href="${appResetUrl}">Open in app</a></p>`
      };
      try {
        await sgMail.send(msg);
        return true;
      } catch (err) {
        console.error('SendGrid sendVerificationOtpEmail error:', err?.response?.body || err.message || err);
        throw err;
      }
    };

    sendPasswordResetEmail = async (email, name, token) => {
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
      const resetUrl = `${backendUrl}/api/auth/reset-password?token=${token}`;
      const appScheme = process.env.MOBILE_APP_SCHEME || 'findmate://';
      const appResetUrl = `${appScheme}reset-password?token=${token}`;
      const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        subject: 'Reset your findMate password',
        html: `<p>Hi ${name},</p>
               <p>Reset your password by clicking <a href="${resetUrl}">this link</a>. The link expires in 1 hour.</p>
               <p>If you're on mobile you can open the app directly: <a href="${appResetUrl}">Open in app</a></p>`
      };
      try {
        await sgMail.send(msg);
        return true;
      } catch (err) {
        console.error('SendGrid sendPasswordResetEmail error:', err?.response?.body || err.message || err);
        throw err;
      }
    };

    sendNotificationEmail = async (email, subject, message) => {
      const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        subject,
        html: `<p>${message}</p>`
      };
      try {
        await sgMail.send(msg);
        return true;
      } catch (err) {
        console.error('SendGrid sendNotificationEmail error:', err?.response?.body || err.message || err);
        throw err;
      }
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
      const appScheme = process.env.MOBILE_APP_SCHEME || 'findmate://';
      const appVerifyUrl = `${appScheme}verify-email?token=${token}`;
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        to: email,
        subject: 'Verify your findMate account',
        html: `<p>Hi ${name},</p><p>Please verify your account by clicking <a href="${verifyUrl}">this link</a>. The link expires in 24 hours.</p>
               <p>If you're on mobile you can open the app directly: <a href="${appVerifyUrl}">Open in app</a></p>`
      };
      await transporter.sendMail(mailOptions);
      return true;
    };

    sendVerificationOtpEmail = async (email, name, otp) => {
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
      const appScheme = process.env.MOBILE_APP_SCHEME || 'findmate://';
      const appResetUrl = `${appScheme}verify-email?otp=${otp}&email=${encodeURIComponent(email)}`;
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        to: email,
        subject: 'Your findMate verification code',
        html: `<p>Hi ${name},</p><p>Your verification code is <strong>${otp}</strong>. It expires in 15 minutes.</p>
               <p>If you're on mobile you can open the app directly: <a href="${appResetUrl}">Open in app</a></p>`
      };
      await transporter.sendMail(mailOptions);
      return true;
    };

    sendPasswordResetEmail = async (email, name, token) => {
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
      const resetUrl = `${backendUrl}/api/auth/reset-password?token=${token}`;
      const appScheme = process.env.MOBILE_APP_SCHEME || 'findmate://';
      const appResetUrl = `${appScheme}reset-password?token=${token}`;
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'no-reply@findmate.local',
        to: email,
        subject: 'Reset your findMate password',
        html: `<p>Hi ${name},</p><p>Reset your password by clicking <a href="${resetUrl}">this link</a>. The link expires in 1 hour.</p>
               <p>If you're on mobile you can open the app directly: <a href="${appResetUrl}">Open in app</a></p>`
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
    const appScheme = process.env.MOBILE_APP_SCHEME || 'findmate://';
    const appVerifyUrl = `${appScheme}verify-email?token=${token}`;
    console.log(`\n📧 VERIFICATION EMAIL (Mock)\nTo: ${email}\nName: ${name}\nToken: ${token}\nLink: ${verifyUrl}\nOpen in app: ${appVerifyUrl}\n`);
    return true;
  };

  sendPasswordResetEmail = async (email, name, token) => {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const resetUrl = `${backendUrl}/api/auth/reset-password?token=${token}`;
    const appScheme = process.env.MOBILE_APP_SCHEME || 'findmate://';
    const appResetUrl = `${appScheme}reset-password?token=${token}`;
    console.log(`\n📧 PASSWORD RESET EMAIL (Mock)\nTo: ${email}\nName: ${name}\nToken: ${token}\nLink: ${resetUrl}\nOpen in app: ${appResetUrl}\n`);
    return true;
  };

  // Mock OTP email
  sendVerificationOtpEmail = async (email, name, otp) => {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const appScheme = process.env.MOBILE_APP_SCHEME || 'findmate://';
    const appResetUrl = `${appScheme}verify-email?otp=${otp}&email=${encodeURIComponent(email)}`;
    console.log(`\n📧 VERIFICATION OTP EMAIL (Mock)\nTo: ${email}\nName: ${name}\nOTP: ${otp}\nOpen in app: ${appResetUrl}\n`);
    return true;
  };

  sendNotificationEmail = async (email, subject, message) => {
    console.log(`\n📧 Notification (Mock)\nTo: ${email}\nSubject: ${subject}\nMessage: ${message}\n`);
    return true;
  };
}

module.exports = {
  sendVerificationEmail,
  sendVerificationOtpEmail,
  sendPasswordResetEmail,
  sendNotificationEmail
};