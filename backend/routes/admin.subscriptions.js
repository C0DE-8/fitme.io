const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware');
const { subscriptionMail } = require('../utils/mailer');

function mapSubscriptionProof(req, sub) {
  const hasProof = !!sub.payment_proof;

  return {
    ...sub,
    payment_proof: hasProof ? `uploads/${sub.payment_proof}` : null,
    payment_proof_url: hasProof
      ? `${req.protocol}://${req.get('host')}/uploads/${sub.payment_proof}`
      : null
  };
}

const VALID_STATUSES = new Set(['pending', 'active', 'inactive', 'cancelled']);

function parsePositiveDays(value, fallback = null) {
  const days = Number(value);
  if (!Number.isInteger(days) || days <= 0) return fallback;
  return days;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// Get all subscriptions (admin)
router.get('/subscriptions', authenticateAdmin, async (req, res) => {
  try {
    const [subscriptions] = await db.promise().query(
      `SELECT
         s.id,
         s.user_id,
         u.username,
         u.email,
         s.plan_name,
         s.status,
         s.start_date,
         s.expiry_date,
         s.payment_proof,
         s.payer_bank_name,
         s.payer_account_name,
         s.payer_account_number
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.start_date DESC, s.id DESC`
    );

    res.json({ subscriptions: subscriptions.map(sub => mapSubscriptionProof(req, sub)) });
  } catch (err) {
    console.error('Failed to fetch subscriptions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin creates a subscription for a user
router.post('/subscriptions', authenticateAdmin, async (req, res) => {
  try {
    const { user_id, plan_name, status = 'active', days = 30, start_date } = req.body;
    const userId = Number(user_id);
    const durationDays = parsePositiveDays(days, 30);

    if (!userId || !plan_name) {
      return res.status(400).json({ error: 'user_id and plan_name are required' });
    }

    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid subscription status' });
    }

    const [[user]] = await db.promise().query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [[plan]] = await db.promise().query('SELECT plan_name FROM plans WHERE plan_name = ? LIMIT 1', [plan_name]);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const startDate = start_date ? new Date(start_date) : new Date();
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'Invalid start_date' });
    }

    const expiryDate = addDays(startDate, durationDays);

    const [result] = await db.promise().query(
      `INSERT INTO subscriptions (user_id, plan_name, status, start_date, expiry_date)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, plan_name, status, startDate, expiryDate]
    );

    res.status(201).json({
      message: 'Subscription added to user account',
      subscription: {
        id: result.insertId,
        user_id: userId,
        plan_name,
        status,
        start_date: startDate,
        expiry_date: expiryDate
      }
    });
  } catch (err) {
    console.error('Failed to create subscription:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin updates a subscription
router.put('/subscriptions/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_name, status, start_date, expiry_date } = req.body;

    const [[existing]] = await db.promise().query('SELECT * FROM subscriptions WHERE id = ? LIMIT 1', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (status && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid subscription status' });
    }

    if (plan_name) {
      const [[plan]] = await db.promise().query('SELECT plan_name FROM plans WHERE plan_name = ? LIMIT 1', [plan_name]);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }
    }

    const nextStartDate = start_date ? new Date(start_date) : existing.start_date;
    const nextExpiryDate = expiry_date ? new Date(expiry_date) : existing.expiry_date;

    if (Number.isNaN(new Date(nextStartDate).getTime()) || Number.isNaN(new Date(nextExpiryDate).getTime())) {
      return res.status(400).json({ error: 'Invalid subscription dates' });
    }

    await db.promise().query(
      `UPDATE subscriptions
       SET plan_name = ?, status = ?, start_date = ?, expiry_date = ?
       WHERE id = ?`,
      [
        plan_name || existing.plan_name,
        status || existing.status,
        nextStartDate,
        nextExpiryDate,
        id
      ]
    );

    res.json({ message: 'Subscription updated successfully' });
  } catch (err) {
    console.error('Failed to update subscription:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin adds one or more days to a subscription
router.post('/subscriptions/:id/extend', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const days = parsePositiveDays(req.body.days);

    if (!days) {
      return res.status(400).json({ error: 'days must be a positive whole number' });
    }

    const [[subscription]] = await db.promise().query(
      'SELECT id, expiry_date FROM subscriptions WHERE id = ? LIMIT 1',
      [id]
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const currentExpiry = subscription.expiry_date ? new Date(subscription.expiry_date) : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const nextExpiryDate = addDays(baseDate, days);

    await db.promise().query(
      `UPDATE subscriptions SET expiry_date = ?, status = 'active' WHERE id = ?`,
      [nextExpiryDate, id]
    );

    res.json({ message: `Subscription extended by ${days} day(s)`, expiry_date: nextExpiryDate });
  } catch (err) {
    console.error('Failed to extend subscription:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin deletes a subscription from a user account
router.delete('/subscriptions/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.promise().query('DELETE FROM subscriptions WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ message: 'Subscription deleted successfully' });
  } catch (err) {
    console.error('Failed to delete subscription:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

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

    const updatedSubs = pendingSubs.map(sub => mapSubscriptionProof(req, sub));

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
