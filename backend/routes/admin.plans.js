const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware');

// Admin creates or updates a subscription plan
router.post('/plans', authenticateAdmin, (req, res) => {
  const { plan_name, price } = req.body;

  if (!plan_name || !price) {
    return res.status(400).json({ error: 'Plan name and price are required' });
  }

  const sql = `
    INSERT INTO plans (plan_name, price)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE price = VALUES(price)
  `;

  db.query(sql, [plan_name, price], (err, result) => {
    if (err) {
      console.error('❌ Failed to create/update plan:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ message: 'Plan created or updated successfully' });
  });
});
// Admin fetches all plans
router.get('/plans', authenticateAdmin, (req, res) => {
  db.query('SELECT * FROM plans', (err, results) => {
    if (err) {
      console.error('❌ Error fetching plans:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ plans: results });
  });
});
// Admin updates a plan (price or name) by ID
router.put('/plans/:id', authenticateAdmin, (req, res) => {
  const planId = req.params.id;
  const { plan_name, price } = req.body;

  if (!plan_name && !price) {
    return res.status(400).json({ error: 'Provide at least one field to update (plan_name or price)' });
  }

  const fields = [];
  const values = [];

  if (plan_name) {
    fields.push('plan_name = ?');
    values.push(plan_name);
  }

  if (price) {
    fields.push('price = ?');
    values.push(price);
  }

  values.push(planId); // for WHERE clause

  const sql = `UPDATE plans SET ${fields.join(', ')} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('❌ Failed to update plan:', err);
      return res.status(500).json({ error: 'Database error during update' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan not found or no changes made' });
    }

    res.json({ message: 'Plan updated successfully' });
  });
});
// Admin deletes a subscription plan by ID only
router.delete('/plans/:id', authenticateAdmin, (req, res) => {
  const planId = req.params.id;

  if (!planId) {
    return res.status(400).json({ error: 'Plan ID is required' });
  }

  const sql = 'DELETE FROM plans WHERE id = ?';

  db.query(sql, [planId], (err, result) => {
    if (err) {
      console.error('❌ Failed to delete plan:', err);
      return res.status(500).json({ error: 'Database error during deletion' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ message: 'Plan deleted successfully' });
  });
});

module.exports = router;
