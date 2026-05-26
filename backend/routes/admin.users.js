const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware');
const moment = require('moment');
const foodFeedRoutes = require('./user.foodFeed');

// GET /admin/users - Admin gets all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const [users] = await db.promise().query(
      `SELECT 
         id,
         username,
         email,
         bio,
         role,
         verified,
         created_at,
         updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    const formattedUsers = users.map(user => ({
      ...user,
      created_at: user.created_at ? moment(user.created_at).format('YYYY-MM-DD HH:mm:ss') : null,
      updated_at: user.updated_at ? moment(user.updated_at).format('YYYY-MM-DD HH:mm:ss') : null
    }));

    res.json({ users: formattedUsers });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/users/subscriptions - Admin gets all users with their subscriptions
router.get('/users/subscriptions', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await db.promise().query(
      `SELECT 
         u.id AS user_id,
         u.username,
         u.email,
         u.role,
         u.verified,
         s.id AS subscription_id,
         s.plan_name,
         s.status AS subscription_status,
         s.start_date,
         s.expiry_date,
         s.payment_proof,
         s.payer_bank_name,
         s.payer_account_name,
         s.payer_account_number
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id
       ORDER BY s.start_date DESC`
    );

    const formatted = results.map(row => {
      const hasProof = !!row.payment_proof;
      return {
        ...row,
        payment_proof: hasProof ? `uploads/${row.payment_proof}` : null,
        payment_proof_url: hasProof
          ? `${req.protocol}://${req.get('host')}/uploads/${row.payment_proof}`
          : null
      };
    });

    res.json({ usersWithSubscriptions: formatted });
  } catch (err) {
    console.error('Failed to fetch users with subscriptions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/users-with-subscriptions - Admin gets all users with subscription info
router.get('/users-with-subscriptions', authenticateAdmin, async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT 
         u.id AS user_id,
         u.username,
         u.email,
         u.role,
         u.verified,
         u.created_at,
         u.updated_at,
         s.id AS subscription_id,
         s.plan_name,
         s.status,
         s.start_date,
         s.expiry_date,
         s.payment_proof,
         s.payer_bank_name,
         s.payer_account_name,
         s.payer_account_number
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
       ORDER BY u.created_at DESC`
    );

    // Format payment proof URLs and keep null if no proof
    const updatedData = rows.map(row => {
      const hasProof = !!row.payment_proof;
      return {
        ...row,
        payment_proof: hasProof ? `uploads/${row.payment_proof}` : null,
        payment_proof_url: hasProof
          ? `${req.protocol}://${req.get('host')}/uploads/${row.payment_proof}`
          : null
      };
    });

    res.json({ users: updatedData });
  } catch (err) {
    console.error('Failed to fetch users with subscriptions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /admin/users/:id - Admin gets single user by ID
router.get('/users/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.promise().query(
      `SELECT 
         id,
         username,
         email,
         bio,
         role,
         verified,
         created_at,
         updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    const formattedUser = {
      ...user,
      created_at: user.created_at ? moment(user.created_at).format('YYYY-MM-DD HH:mm:ss') : null,
      updated_at: user.updated_at ? moment(user.updated_at).format('YYYY-MM-DD HH:mm:ss') : null
    };

    res.json({ user: formattedUser });
  } catch (err) {
    console.error('Failed to fetch user by ID:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /admin/users/:id - Admin deletes a user account
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Valid user id is required' });
  }

  if (userId === Number(req.user.id)) {
    return res.status(400).json({ error: 'You cannot delete your own admin account from this page.' });
  }

  try {
    const [rows] = await db.promise().query(
      'SELECT id, username, role FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    await foodFeedRoutes.ensureFoodFeedTables();

    const conn = db.promise();
    await conn.beginTransaction();

    try {
      await conn.query(
        `DELETE cr
         FROM food_feed_comment_reactions cr
         JOIN food_feed_comments c ON c.id = cr.comment_id
         WHERE c.user_id = ?`,
        [userId]
      );
      await conn.query(
        `DELETE cr
         FROM food_feed_comment_reactions cr
         JOIN food_feed_posts p ON p.id = cr.post_id
         WHERE p.user_id = ?`,
        [userId]
      );
      await conn.query(
        `DELETE FROM food_feed_comment_reactions
         WHERE comment_author_user_id = ? OR reactor_user_id = ?`,
        [userId, userId]
      );
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

    res.json({ message: `${rows[0].username || 'User'} deleted successfully.` });
  } catch (err) {
    console.error('Failed to delete user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
