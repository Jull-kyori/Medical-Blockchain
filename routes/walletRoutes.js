const express = require('express');
const router = express.Router();
const { createWallet, sendMED, getWallets, getTransactions } = require('../src/wallet');

// GET /api/wallet — ambil semua wallet & transaksi
router.get('/', (req, res) => {
  res.json({ wallets: getWallets(), transactions: getTransactions() });
});

// POST /api/wallet/create — buat wallet baru
router.post('/create', (req, res) => {
  try {
    const { label } = req.body;
    const wallet = createWallet(label || 'Patient Wallet');
    res.json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wallet/send — kirim MED coin
router.post('/send', (req, res) => {
  try {
    const { from, to, amount } = req.body;
    const tx = sendMED(from, to, Number(amount));
    res.json({ success: true, transaction: tx });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;