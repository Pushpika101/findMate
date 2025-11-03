const https = require('https');
const { query } = require('../config/database');

// Ensure device_tokens table exists
const ensureTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        platform TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error('Error ensuring device_tokens table:', err);
  }
};

ensureTable();

const registerDeviceToken = async (userId, token, platform = null) => {
  try {
    // upsert
    await query(
      `INSERT INTO device_tokens (user_id, token, platform) VALUES ($1, $2, $3)
       ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, created_at = NOW()`,
      [userId, token, platform]
    );
    return true;
  } catch (error) {
    console.error('Error registering device token:', error);
    throw error;
  }
};

const removeDeviceToken = async (token) => {
  try {
    await query('DELETE FROM device_tokens WHERE token = $1', [token]);
    return true;
  } catch (error) {
    console.error('Error removing device token:', error);
    throw error;
  }
};

const getTokensForUser = async (userId) => {
  try {
    const res = await query('SELECT token FROM device_tokens WHERE user_id = $1', [userId]);
    return res.rows.map(r => r.token);
  } catch (error) {
    console.error('Error getting tokens for user:', error);
    throw error;
  }
};

// Send push notifications using Expo Push API
const sendPushToTokens = async (tokens, message) => {
  try {
    if (!tokens || tokens.length === 0) return { success: true, sent: 0 };

    // Build messages per Expo spec
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: message.data || {}
    }));

    // Expo recommends batching in chunks of 100
    const chunkSize = 100;
    let sent = 0;

    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      const payload = JSON.stringify(chunk);

      const options = {
        hostname: 'exp.host',
        port: 443,
        path: '/--/api/v2/push/send',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json'
        }
      };

      await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (d) => data += d);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              // Log Expo response for debugging
              console.log('Expo push response chunk:', JSON.stringify(parsed));
              // count messages sent in this chunk
              sent += chunk.length;
              resolve(parsed);
            } catch (err) {
              console.warn('Could not parse Expo response:', err, 'raw:', data);
              sent += chunk.length;
              resolve({ success: true, raw: data });
            }
          });
        });

        req.on('error', (e) => {
          console.error('Error sending push chunk:', e);
          reject(e);
        });

        req.write(payload);
        req.end();
      });
    }

    return { success: true, sent };
  } catch (error) {
    console.error('Error in sendPushToTokens:', error);
    return { success: false, error };
  }
};

module.exports = {
  registerDeviceToken,
  removeDeviceToken,
  getTokensForUser,
  sendPushToTokens
};
