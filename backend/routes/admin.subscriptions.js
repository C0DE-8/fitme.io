const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware');
const { subscriptionMail } = require('../utils/mailer');

// Get all pending subscriptions (admin)
router.get('/subscriptions/pending', authenticateAdmin, async (req, res) => {
  try {
    const [pendingSubs] = await db.promise().query(
      `SELECT 
         s.id,
         s.user_id,
         u.username,
         u.email,
         s.plan_name,
         s.start_date,
         s.expiry_date,
         s.payment_proof,
         s.payer_bank_name,
         s.payer_account_name,
         s.payer_account_number
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       WHERE s.status = 'pending'
       ORDER BY s.start_date DESC`
    );

    const updatedSubs = pendingSubs.map(sub => {
      const hasProof = !!sub.payment_proof;
      return {
        ...sub,
        payment_proof: hasProof ? `uploads/${sub.payment_proof}` : null,
        payment_proof_url: hasProof
          ? `${req.protocol}://${req.get('host')}/uploads/${sub.payment_proof}`
          : null
      };
    });

    res.json({ pendingSubscriptions: updatedSubs });
  } catch (err) {
    console.error('Failed to fetch pending subscriptions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// Confirm subscription
router.post('/subscriptions/:id/confirm', authenticateAdmin, async (req, res) => {
  const subscriptionId = req.params.id;
  try {
    // Update subscription status to active
    const [result] = await db.promise().query(
      `UPDATE subscriptions SET status = 'active' WHERE id = ? AND status = 'pending'`,
      [subscriptionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pending subscription not found' });
    }

    // Get subscription + user info to send mail
    const [[subscription]] = await db.promise().query(
      `SELECT s.*, u.email, u.username 
       FROM subscriptions s JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
      [subscriptionId]
    );

    if (subscription && subscription.email) {
      await subscriptionMail(
        subscription.email,
        subscription.username,
        'active',
        subscription.start_date.toISOString().split('T')[0],   // format YYYY-MM-DD
        subscription.expiry_date.toISOString().split('T')[0]
      );
    }

    res.json({ message: 'Subscription confirmed and activated, email sent' });
  } catch (err) {
    console.error('Failed to confirm subscription:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// Reject subscription
router.post('/subscriptions/:id/reject', authenticateAdmin, async (req, res) => {
  const subscriptionId = req.params.id;
  try {
    // Update subscription status to cancelled
    const [result] = await db.promise().query(
      `UPDATE subscriptions SET status = 'cancelled' WHERE id = ? AND status = 'pending'`,
      [subscriptionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pending subscription not found' });
    }

    // Get subscription + user info to send mail
    const [[subscription]] = await db.promise().query(
      `SELECT s.*, u.email, u.username 
       FROM subscriptions s JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
      [subscriptionId]
    );

    if (subscription && subscription.email) {
      await subscriptionMail(
        subscription.email,
        subscription.username,
        'cancelled',
        subscription.start_date.toISOString().split('T')[0],
        subscription.expiry_date.toISOString().split('T')[0]
      );
    }

    res.json({ message: 'Subscription rejected and cancelled, email sent' });
  } catch (err) {
    console.error('Failed to reject subscription:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
