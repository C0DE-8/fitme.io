const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateUser } = require('../middleware');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const foodFeedRoutes = require('./user.foodFeed');

async function getSocialTotals(userId) {
  await foodFeedRoutes.ensureFoodFeedTables();

  const [[followers], [following], [likes]] = await Promise.all([
    db.promise().query(
      'SELECT COUNT(*) AS total FROM food_feed_follows WHERE following_user_id = ?',
      [userId]
    ),
    db.promise().query(
      'SELECT COUNT(*) AS total FROM food_feed_follows WHERE follower_user_id = ?',
      [userId]
    ),
    db.promise().query(
      'SELECT COUNT(*) AS total FROM food_feed_reactions WHERE post_author_user_id = ?',
      [userId]
    )
  ]);

  return {
    followers: Number(followers[0]?.total || 0),
    following: Number(following[0]?.total || 0),
    likes: Number(likes[0]?.total || 0)
  };
}

async function getProfile(userId) {
  const [rows] = await db.promise().query(
    `SELECT id, username, email, bio, role, verified, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );

  if (!rows.length) return null;

  const user = rows[0];
  user.created_at_formatted = moment(user.created_at).format('YYYY-MM-DD HH:mm:ss');
  user.updated_at_formatted = moment(user.updated_at).format('YYYY-MM-DD HH:mm:ss');
  user.created_at_from_now = moment(user.created_at).fromNow();
  user.updated_at_from_now = moment(user.updated_at).fromNow();
  user.social_totals = await getSocialTotals(userId);

  return user;
}

// GET /profile - Get logged-in user's profile
router.get('/profile', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await getProfile(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profile: user });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// PUT /profile - Update logged-in user's profile details
router.put('/profile', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const { username, email, bio } = req.body;

  try {
    const [existing] = await db.promise().query(
      'SELECT id, username, email FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (!existing.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update fields dynamically
    const updates = [];
    const values = [];

    const cleanUsername = String(username || '').trim();
    const cleanEmail = String(email || '').trim();

    if (username !== undefined && !cleanUsername) {
      return res.status(400).json({ error: 'Username is required.' });
    }
    if (email !== undefined && !cleanEmail) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    if (cleanUsername && cleanUsername !== existing[0].username) {
      updates.push('username = ?');
      values.push(cleanUsername);
    }
    if (cleanEmail && cleanEmail !== existing[0].email) {
      updates.push('email = ?');
      values.push(cleanEmail);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(String(bio || '').trim().slice(0, 500) || null);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'No changes provided.' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    values.push(userId);

    await db.promise().query(sql, values);

    res.json({
      message: 'Profile updated successfully.',
      profile: await getProfile(userId)
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email is already in use.' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /profile/password - Change logged-in user's password
router.put('/profile/password', authenticateUser, async (req, res) => {
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
      'SELECT id, password_hash FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
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
    console.error('Error changing user password:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /profile - Delete logged-in user's own account
router.delete('/profile', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const password = String(req.body?.password || '');

  if (!password) {
    return res.status(400).json({ error: 'Password is required to delete your account.' });
  }

  try {
    const [rows] = await db.promise().query(
      'SELECT id, password_hash FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Password is incorrect.' });
    }

    await foodFeedRoutes.ensureFoodFeedTables();

    const conn = db.promise();
    await conn.beginTransaction();

    try {
      await conn.query(
        `DELETE c
         FROM food_feed_comments c
         JOIN food_feed_posts p ON p.id = c.post_id
         WHERE p.user_id = ?`,
        [userId]
      );
      await conn.query('DELETE FROM food_feed_comments WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM food_feed_posts WHERE user_id = ?', [userId]);
      await conn.query(
        'DELETE FROM food_feed_reactions WHERE reactor_user_id = ? OR post_author_user_id = ?',
        [userId, userId]
      );
      await conn.query(
        'DELETE FROM food_feed_follows WHERE follower_user_id = ? OR following_user_id = ?',
        [userId, userId]
      );
      try {
        await conn.query('DELETE FROM storage_friend_suggestions WHERE owner_user_id = ?', [userId]);
      } catch (deleteError) {
        if (deleteError.code !== 'ER_NO_SUCH_TABLE') throw deleteError;
      }
      await conn.query('DELETE FROM storage_shares WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM user_storage WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM chat_history WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM subscriptions WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM otps WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM users WHERE id = ?', [userId]);
      await conn.commit();
    } catch (deleteError) {
      await conn.rollback();
      throw deleteError;
    }

    return res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('Error deleting user account:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
