const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware');
const moment = require('moment');

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

module.exports = router;
