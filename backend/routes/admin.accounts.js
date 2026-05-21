const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db');
const fs = require('fs');
const { authenticateAdmin } = require('../middleware');
const { ACCOUNT_LOGO_DIR, uploadAccountLogo } = require('../services/accountLogoUpload');

// POST /admin/accounts — add a bank account (admin only)
router.post('/accounts', authenticateAdmin,
  uploadAccountLogo.single('account_logo'), // 👈 using dedicated multer instance
  async (req, res) => {
    try {
      const { bank_name, account_name, account_number } = req.body;
      const logoFile = req.file;

      // Basic validation
      if (!bank_name || !account_name || !account_number) {
        return res.status(400).json({ error: 'bank_name, account_name and account_number are required.' });
      }
      if (!logoFile) {
        return res.status(400).json({ error: 'account_logo image is required.' });
      }

      const acctNumber = String(account_number).trim();

      // Prevent duplicates
      const [exists] = await db.promise().query(
        'SELECT id FROM bank_accounts WHERE account_number = ? LIMIT 1',
        [acctNumber]
      );
      if (exists.length) {
        try { fs.unlinkSync(logoFile.path); } catch {}
        return res.status(409).json({ error: 'An entry with this account_number already exists.' });
      }

      // Insert
      const [result] = await db.promise().query(
        `INSERT INTO bank_accounts (bank_name, account_name, account_number, account_logo)
         VALUES (?, ?, ?, ?)`,
        [bank_name.trim(), account_name.trim(), acctNumber, logoFile.filename]
      );

      res.status(201).json({
        message: 'Bank account added.',
        account: {
          id: result.insertId,
          bank_name: bank_name.trim(),
          account_name: account_name.trim(),
          account_number: acctNumber,
          account_logo: logoFile.filename
        }
      });
    } catch (err) {
      console.error('Add bank account error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);
// GET /admin/accounts — list all bank accounts (admin only)
router.get('/accounts', authenticateAdmin, async (req, res) => {
  try {
    const [accounts] = await db.promise().query(
      `SELECT 
         id, 
         bank_name, 
         account_name, 
         account_number, 
         account_logo, 
         created_at 
       FROM bank_accounts
       ORDER BY created_at DESC`
    );

    res.json({ accounts });
  } catch (err) {
    console.error('Error fetching bank accounts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// PUT /admin/accounts/:id — update bank account (admin only)
router.put('/accounts/:id', authenticateAdmin, uploadAccountLogo.single('account_logo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { bank_name, account_name, account_number } = req.body;
      const logoFile = req.file;

      // Check if account exists
      const [existing] = await db.promise().query(
        'SELECT * FROM bank_accounts WHERE id = ?',
        [id]
      );
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Bank account not found.' });
      }

      // Prepare updated fields
      const updates = {
        bank_name: bank_name?.trim() || existing[0].bank_name,
        account_name: account_name?.trim() || existing[0].account_name,
        account_number: account_number
          ? String(account_number).trim()
          : existing[0].account_number,
        account_logo: existing[0].account_logo
      };

      // Replace logo if provided
      if (logoFile) {
        // delete old logo file
        try { fs.unlinkSync(path.join(ACCOUNT_LOGO_DIR, existing[0].account_logo)); } catch {}
        updates.account_logo = logoFile.filename;
      }

      // Update in DB
      await db.promise().query(
        `UPDATE bank_accounts
         SET bank_name = ?, account_name = ?, account_number = ?, account_logo = ?
         WHERE id = ?`,
        [updates.bank_name, updates.account_name, updates.account_number, updates.account_logo, id]
      );

      res.json({ message: 'Bank account updated successfully.', account: updates });
    } catch (err) {
      console.error('Update bank account error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);
// DELETE /admin/accounts/:id — delete bank account (admin only)
router.delete('/accounts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

      // Check if exists
      const [existing] = await db.promise().query(
        'SELECT * FROM bank_accounts WHERE id = ?',
        [id]
      );
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Bank account not found.' });
      }

      // Delete logo file
      try {
        fs.unlinkSync(path.join(ACCOUNT_LOGO_DIR, existing[0].account_logo));
      } catch {}

      // Delete from DB
      await db.promise().query('DELETE FROM bank_accounts WHERE id = ?', [id]);

      res.json({ message: 'Bank account deleted successfully.' });
    } catch (err) {
      console.error('Delete bank account error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
