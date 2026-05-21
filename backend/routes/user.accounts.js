const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateUser } = require('../middleware');

// GET /accounts — visible to any authenticated user
router.get('/accounts', authenticateUser, async (req, res) => {
  try {
    const [accounts] = await db.promise().query(
      `SELECT id, bank_name, account_name, account_number, account_logo 
       FROM bank_accounts
       ORDER BY bank_name ASC`
    );

    res.json({ accounts });
  } catch (err) {
    console.error('Error fetching accounts for user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
