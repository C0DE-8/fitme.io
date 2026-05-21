const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateUser } = require('../middleware');
const moment = require('moment');

// GET /profile - Get logged-in user's profile
router.get('/profile', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.promise().query(
      `SELECT id, username, email, bio, role, verified, created_at, updated_at
       FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    // Format timestamps with moment
    user.created_at_formatted = moment(user.created_at).format('YYYY-MM-DD HH:mm:ss');
    user.updated_at_formatted = moment(user.updated_at).format('YYYY-MM-DD HH:mm:ss');

    // Human-readable "time ago"
    user.created_at_from_now = moment(user.created_at).fromNow();
    user.updated_at_from_now = moment(user.updated_at).fromNow();

    res.json({ profile: user });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// PUT /profile - Update logged-in user's profile (NO password change)
router.put('/profile', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const { username, email, bio } = req.body;

  try {
    // Fetch existing user to check
    const [existing] = await db.promise().query(
      'SELECT id FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (!existing.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update fields dynamically
    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username.trim());
    }
    if (email) {
      updates.push('email = ?');
      values.push(email.trim());
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio || null);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'No changes provided.' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    values.push(userId);

    await db.promise().query(sql, values);

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
