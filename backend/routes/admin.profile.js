const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware');
const moment = require('moment');
const bcrypt = require('bcryptjs');

// GET /profile - Get logged-in user's profile
router.get('/profile', authenticateAdmin, async (req, res) => {
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
// PUT /profile - Update logged-in admin's profile details
router.put('/profile', authenticateAdmin, async (req, res) => {
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

// PUT /profile/password - Change logged-in admin's own password
router.put('/profile/password', authenticateAdmin, async (req, res) => {
  const userId = req.user.id;
  const currentPassword = String(req.body?.current_password || '');
  const newPassword = String(req.body?.new_password || '');
  const confirmPassword = String(req.body?.confirm_password || '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Current password, new password, and confirmation are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password confirmation does not match.' });
  }

  if (newPassword === currentPassword) {
    return res.status(400).json({ error: 'Choose a different new password.' });
  }

  try {
    const [rows] = await db.promise().query(
      'SELECT id, password_hash FROM users WHERE id = ? AND role = ? LIMIT 1',
      [userId, 'admin']
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const currentPasswordValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!currentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.promise().query(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );

    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Error changing admin password:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
