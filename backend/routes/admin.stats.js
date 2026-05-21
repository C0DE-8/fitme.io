const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware');

// GET /admin/stats/users - Admin gets total users and subscriptions count
router.get('/stats/users', authenticateAdmin, async (req, res) => {
  try {
    // Query total users
    const [usersCountResult] = await db.promise().query(
      `SELECT COUNT(*) AS total_users FROM users`
    );

    // Query total subscriptions
    const [subsCountResult] = await db.promise().query(
      `SELECT COUNT(*) AS total_subscriptions FROM subscriptions`
    );

    res.json({
      totalUsers: usersCountResult[0].total_users,
      totalSubscriptions: subsCountResult[0].total_subscriptions
    });
  } catch (err) {
    console.error('Failed to fetch user/subscription counts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
