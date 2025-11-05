#!/usr/bin/env node
// Run this script to ensure verification/reset columns exist on users table.
// Usage: node src/scripts/ensure_verification_columns.js
const { query, pool } = require('../config/database');

(async () => {
  try {
    console.log('Ensuring verification/reset columns exist on users table...');

    const statements = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(128);`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_otp_hash VARCHAR(255);`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_otp_expires TIMESTAMP;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_otp_attempts INTEGER DEFAULT 0;`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_otp_locked_until TIMESTAMP;`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(128);`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;`
    ];

    for (const s of statements) {
      console.log('Running:', s);
      await query(s);
    }

    console.log('✅ Done.');
  } catch (err) {
    console.error('Error ensuring columns:', err);
  } finally {
    // close pool
    try { await pool.end(); } catch (e) {}
    process.exit(0);
  }
})();
