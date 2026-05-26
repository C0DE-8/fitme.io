const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { otpMail, welcomeMail } = require('../utils/mailer');
const foodFeedRoutes = require('./user.foodFeed');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function applyNewUserAutoFollows(userId) {
  try {
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS admin_auto_follow_settings (
        id TINYINT UNSIGNED NOT NULL DEFAULT 1 PRIMARY KEY,
        enabled TINYINT(1) NOT NULL DEFAULT 0,
        target_user_ids TEXT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [settingsRows] = await db.promise().query(
      'SELECT enabled, target_user_ids FROM admin_auto_follow_settings WHERE id = 1 LIMIT 1'
    );
    const settings = settingsRows[0];
    if (!settings?.enabled) return;

    const targetUserIds = String(settings.target_user_ids || '')
      .split(',')
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0 && id !== Number(userId));

    if (!targetUserIds.length) return;

    await foodFeedRoutes.ensureFoodFeedTables();

    const values = [...new Set(targetUserIds)].map((targetId) => [userId, targetId]);
    await db.promise().query(
      `INSERT IGNORE INTO food_feed_follows (follower_user_id, following_user_id)
       VALUES ?`,
      [values]
    );
  } catch (err) {
    console.error('Failed to apply new-user auto follows:', err);
  }
}

// Register Route
router.post('/register', async (req, res) => {
  const { username, email, bio, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [existing] = await db.promise().query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.promise().query(
      `INSERT INTO users (username, email, bio, password_hash) VALUES (?, ?, ?, ?)`,
      [username, email, bio || '', hashedPassword]
    );

    const userId = result.insertId;
    await applyNewUserAutoFollows(userId);

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP in otps table
    await db.promise().query(
      `INSERT INTO otps (user_id, otp_code, expires_at) VALUES (?, ?, ?)`,
      [userId, otp, expiry]
    );

    await otpMail(email, otp); // send OTP

    res.json({ message: 'Registered successfully. OTP sent to email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP Route
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP required' });
  }

  try {
    // Get user
    const [users] = await db.promise().query('SELECT id, username, verified FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(400).json({ message: 'User not found' });

    const user = users[0];
    if (user.verified) return res.json({ message: 'User already verified' });

    // Get OTP
    const [otps] = await db.promise().query(
      'SELECT otp_code, expires_at FROM otps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [user.id]
    );

    if (!otps.length) return res.status(400).json({ message: 'No OTP found' });

    const record = otps[0];

    if (record.otp_code !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Mark user as verified and delete used OTP
    await db.promise().query('UPDATE users SET verified = TRUE WHERE id = ?', [user.id]);
    await db.promise().query('DELETE FROM otps WHERE user_id = ?', [user.id]);

    await welcomeMail(email, user.username);

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Missing identifier or password' });
  }

  try {
    const [users] = await db.promise().query(
      'SELECT id, username, email, password_hash, verified, role FROM users WHERE username = ? OR email = ?',
      [identifier, identifier]
    );

    if (!users.length) return res.status(400).json({ message: 'User not found' });

    const user = users[0];
    if (!user.verified) return res.status(403).json({ message: 'Email not verified' });

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) return res.status(401).json({ message: 'Invalid password' });

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'this_is_gods_not_man_990_555_heaven';
    const JWT_ADMIN_SECRET =
      process.env.JWT_ADMIN_SECRET || `${JWT_SECRET}_admin_fitme_io`;

    const basePayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    let token;
    if (user.role === 'admin') {
      token = jwt.sign(
        { ...basePayload, typ: 'admin' },
        JWT_ADMIN_SECRET,
        { expiresIn: '7d' }
      );
    } else {
      token = jwt.sign(
        { ...basePayload, typ: 'user' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
    }

    res.json({
      message: 'Login successful',
      token,
      token_kind: user.role === 'admin' ? 'admin' : 'user',
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
