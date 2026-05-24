const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateUser, hasActiveSubscription } = require('../middleware');
const uploadPaymentProof = require('../services/paymentProofUpload');
const { sendTelegramAdminAlert } = require('../services/telegram');

// User subscribes to a plan with payment proof image
router.post('/subscribe', authenticateUser, uploadPaymentProof.single('payment_proof'), async (req, res) => {
  const userId = req.user.id;
  const { plan_name } = req.body;
  const paymentProofFile = req.file;

  if (!plan_name) {
    return res.status(400).json({ error: 'Plan name is required' });
  }
  if (!paymentProofFile) {
    return res.status(400).json({ error: 'Payment proof image is required' });
  }

  try {
    // Check if plan exists
    const [plans] = await db.promise().query('SELECT * FROM plans WHERE plan_name = ?', [plan_name]);
    if (!plans.length) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Check if user already has active or pending subscription for this plan
    const [existingSubs] = await db.promise().query(
      'SELECT * FROM subscriptions WHERE user_id = ? AND plan_name = ? AND status IN ("active", "pending")',
      [userId, plan_name]
    );
    if (existingSubs.length) {
      return res.status(400).json({ error: 'You already have an active or pending subscription to this plan' });
    }

    // Set subscription dates and pending status
    const startDate = new Date();
    // expiryDate for active subscriptions; for pending maybe null or startDate + 1 hour payment window
    const expiryDate = new Date(startDate.getTime() + 30*24*60*60*1000); // 30 days from start

    // Insert subscription with status pending and payment proof path
    await db.promise().query(
      `INSERT INTO subscriptions (user_id, plan_name, status, start_date, expiry_date, payment_proof)
       VALUES (?, ?, 'pending', ?, ?, ?)`,
      [userId, plan_name, startDate, expiryDate, paymentProofFile.filename]
    );

    // Respond with message + payment window countdown in seconds (3600 = 1 hour)
    res.json({
      message: `Subscription request received for ${plan_name}. Await confirmation.`,
      payment_window_seconds: 3600,
    });

  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// PUT /subscriptions/:id/payer — user sets bank & account info for their pending sub
router.put('/subscriptions/:id/payer', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { payer_bank_name, payer_account_name, payer_account_number } = req.body;

  if (!payer_bank_name || !payer_account_name) {
    return res.status(400).json({ error: 'payer_bank_name and payer_account_name are required.' });
  }

  try {
    // Ensure this subscription exists & belongs to the user
    const [rows] = await db.promise().query(
      'SELECT id, user_id, status FROM subscriptions WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Subscription not found' });
    if (rows[0].user_id !== userId) return res.status(403).json({ error: 'Not allowed' });

    // Optionally restrict to pending only (comment this out if you want to allow edits later)
    if (rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'You can only update payer info while the subscription is pending.' });
    }

    await db.promise().query(
      `UPDATE subscriptions
         SET payer_bank_name = ?, payer_account_name = ?, payer_account_number = ?
       WHERE id = ?`,
      [payer_bank_name.trim(), payer_account_name.trim(), (payer_account_number || null), id]
    );

    const [[subscription]] = await db.promise().query(
      `SELECT s.id, s.plan_name, s.status, s.start_date, s.expiry_date,
              s.payer_bank_name, s.payer_account_name, s.payer_account_number,
              u.username, u.email
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?
       LIMIT 1`,
      [id]
    );

    if (subscription) {
      const alert = [
        '<b>fitme.io subscription request</b>',
        `User: ${subscription.username} (${subscription.email})`,
        `Plan: ${subscription.plan_name}`,
        `Status: ${subscription.status}`,
        `Payer bank: ${subscription.payer_bank_name || 'N/A'}`,
        `Payer name: ${subscription.payer_account_name || 'N/A'}`,
        `Payer number: ${subscription.payer_account_number || 'N/A'}`,
        `Subscription ID: ${subscription.id}`
      ].join('\n');

      sendTelegramAdminAlert(alert).catch((telegramErr) => {
        console.error('Telegram subscription alert failed:', telegramErr);
      });
    }

    res.json({ message: 'Payer info saved.' });
  } catch (err) {
    console.error('Update payer info error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// GET /subscriptions/my — get current user's subscriptions (IDs + details)
router.get('/subscriptions/my', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query; // optional: e.g., ?status=pending

  try {
    let query = `
      SELECT 
        id, 
        plan_name, 
        status, 
        start_date, 
        expiry_date,
        payer_bank_name,
        payer_account_name,
        payer_account_number
      FROM subscriptions
      WHERE user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY start_date DESC';

    const [subs] = await db.promise().query(query, params);

    res.json({
      subscriptions: subs,
      ids: subs.map(s => s.id) // quick access to just IDs
    });
  } catch (err) {
    console.error('Fetch user subscriptions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Public route to get all plans
router.get('/plans', (req, res) => {
  db.query('SELECT id, plan_name, price, created_at FROM plans', (err, results) => {
    if (err) {
      console.error('❌ Error fetching plans:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ plans: results });
  });
});
// Check if user has an active subscription
router.get('/subscription/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const activeSub = await hasActiveSubscription(userId);

    if (activeSub) {
      return res.json({
        subscribed: true,
        plan: activeSub.plan_name,
        start_date: activeSub.start_date,
        expiry_date: activeSub.expiry_date,
        status: activeSub.status
      });
    }

    const [latestRows] = await db.promise().query(
      `SELECT plan_name, status, start_date, expiry_date
       FROM subscriptions
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [userId]
    );
    const latest = latestRows[0] || null;

    let reason = 'none';
    let message = 'No active subscription found.';

    if (latest) {
      if (latest.status === 'pending') {
        reason = 'pending';
        message = 'Subscription pending verification.';
      } else if (latest.expiry_date && new Date(latest.expiry_date) < new Date()) {
        reason = 'expired';
        message = 'Your plan has expired. Subscribe again to continue.';
      } else if (latest.status === 'cancelled') {
        reason = 'cancelled';
        message = 'Your subscription was cancelled. Choose a plan to reactivate.';
      } else if (latest.status === 'inactive') {
        reason = 'inactive';
        message = 'Your subscription is inactive. Choose a plan to continue.';
      } else {
        reason = 'inactive';
        message = 'No active subscription.';
      }
    }

    const body = {
      subscribed: false,
      message,
      reason
    };
    if (latest) {
      body.plan = latest.plan_name;
      body.status = latest.status;
      body.start_date = latest.start_date;
      body.expiry_date = latest.expiry_date;
    }

    return res.json(body);
  } catch (err) {
    console.error('Error checking subscription status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// GET /subscriptions/status — get only the subscription status
router.get('/sub/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get the most recent subscription
    const [subs] = await db.promise().query(
      `SELECT status 
       FROM subscriptions
       WHERE user_id = ?
       ORDER BY start_date DESC
       LIMIT 1`,
      [userId]
    );

    if (!subs.length) {
      return res.json({ status: null }); // no subscription found
    }

    res.json({ status: subs[0].status }); // one of: pending, active, inactive, cancelled
  } catch (err) {
    console.error('Failed to fetch subscription status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
