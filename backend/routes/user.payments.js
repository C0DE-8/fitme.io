const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware');
const { getBanks, resolveAccount } = require('../services/flutterwave');

router.get('/payments/banks', authenticateUser, async (req, res) => {
  try {
    const country = String(req.query.country || 'NG').trim().toUpperCase();
    const banks = await getBanks(country);

    res.json({
      banks: banks.map((bank) => ({
        id: bank.id,
        code: bank.code,
        name: bank.name
      }))
    });
  } catch (err) {
    console.error('Flutterwave banks error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Unable to fetch banks' });
  }
});

router.post('/payments/resolve-account', authenticateUser, async (req, res) => {
  try {
    const { account_bank, account_number } = req.body;

    if (!account_bank || !account_number) {
      return res.status(400).json({ error: 'account_bank and account_number are required' });
    }

    const account = await resolveAccount(String(account_bank).trim(), String(account_number).trim());

    res.json({ account });
  } catch (err) {
    console.error('Flutterwave account resolve error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Unable to resolve account' });
  }
});

module.exports = router;
