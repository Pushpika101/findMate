#!/usr/bin/env node
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/database');

(async () => {
  try {
    const email = process.argv[2];
    const otp = process.argv[3];
    if (!email || !otp) {
      console.log('Usage: node src/scripts/check_otp.js <email> <otp>');
      process.exit(1);
    }

    const res = await query('SELECT id, email, is_verified, verification_otp_hash, verification_otp_expires, verification_otp_attempts, verification_otp_locked_until FROM users WHERE email=$1', [email]);
    if (res.rows.length === 0) {
      console.log('User not found for email:', email);
      process.exit(0);
    }

    const user = res.rows[0];

    console.log('User:', { id: user.id, email: user.email, is_verified: user.is_verified });
    console.log('Has OTP stored:', !!user.verification_otp_hash);
    console.log('OTP expires:', user.verification_otp_expires);
    console.log('OTP attempts:', user.verification_otp_attempts);
    console.log('OTP locked until:', user.verification_otp_locked_until);

    if (!user.verification_otp_hash) {
      console.log('No active OTP for this user.');
      process.exit(0);
    }

    const isLocked = user.verification_otp_locked_until && new Date(user.verification_otp_locked_until) > new Date();
    console.log('Is locked:', isLocked);

    const isExpired = !user.verification_otp_expires || new Date(user.verification_otp_expires) < new Date();
    console.log('Is expired:', isExpired);

    const ok = await bcrypt.compare(String(otp).trim(), user.verification_otp_hash);
    console.log('OTP match:', ok);

    process.exit(0);
  } catch (err) {
    console.error('Error checking OTP:', err);
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  } finally {
    try { await pool.end(); } catch (e) {}
  }
})();
