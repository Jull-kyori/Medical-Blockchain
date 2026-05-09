// routes/contractRoutes.js
const express = require('express');
const router  = express.Router();
const sc      = require('../src/smartContract');

// ─── GET /api/contract ───────────────────────
// Ambil semua contract yang sudah di-deploy
router.get('/', (req, res) => {
  res.json({ contracts: sc.getContracts() });
});

// ─── GET /api/contract/logs ──────────────────
// Ambil semua log eksekusi (opsional: ?contractId=xxx)
router.get('/logs', (req, res) => {
  const { contractId } = req.query;
  res.json({ logs: sc.getLogs(contractId) });
});

// ─── GET /api/contract/:id ───────────────────
// Ambil satu contract by ID
router.get('/:id', (req, res) => {
  const contract = sc.getContractById(req.params.id);
  if (!contract) return res.status(404).json({ error: 'Contract tidak ditemukan' });
  res.json({ contract });
});

// ────────────────────────────────────────────
//  INSURANCE CONTRACT
// ────────────────────────────────────────────

// POST /api/contract/insurance/deploy
router.post('/insurance/deploy', (req, res) => {
  try {
    const { ownerAddress, fundAmount } = req.body;
    if (!ownerAddress || !fundAmount) {
      return res.status(400).json({ error: 'ownerAddress dan fundAmount wajib diisi' });
    }
    const contract = sc.deployInsuranceContract(ownerAddress, Number(fundAmount));
    res.json({ success: true, contract });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contract/insurance/claim
router.post('/insurance/claim', (req, res) => {
  try {
    const { contractId, patientId, diagnosis, diagnosisLevel, walletAddress } = req.body;
    if (!contractId || !patientId || !diagnosis) {
      return res.status(400).json({ error: 'contractId, patientId, dan diagnosis wajib diisi' });
    }
    const result = sc.executeInsuranceClaim(
      contractId, patientId, diagnosis,
      diagnosisLevel || 1, walletAddress || 'unknown'
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ────────────────────────────────────────────
//  ACCESS CONTROL CONTRACT
// ────────────────────────────────────────────

// POST /api/contract/access/deploy
router.post('/access/deploy', (req, res) => {
  try {
    const { ownerAddress } = req.body;
    if (!ownerAddress) return res.status(400).json({ error: 'ownerAddress wajib diisi' });
    const contract = sc.deployAccessContract(ownerAddress);
    res.json({ success: true, contract });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contract/access/grant
router.post('/access/grant', (req, res) => {
  try {
    const { contractId, patientId, doctorAddress, grantedBy } = req.body;
    const result = sc.grantAccess(contractId, patientId, doctorAddress, grantedBy);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/contract/access/revoke
router.post('/access/revoke', (req, res) => {
  try {
    const { contractId, patientId, doctorAddress, revokedBy } = req.body;
    const result = sc.revokeAccess(contractId, patientId, doctorAddress, revokedBy);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/contract/access/check
router.post('/access/check', (req, res) => {
  try {
    const { contractId, patientId, doctorAddress } = req.body;
    const result = sc.checkAccess(contractId, patientId, doctorAddress);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ────────────────────────────────────────────
//  PAYMENT CONTRACT
// ────────────────────────────────────────────

// POST /api/contract/payment/deploy
router.post('/payment/deploy', (req, res) => {
  try {
    const { ownerAddress } = req.body;
    if (!ownerAddress) return res.status(400).json({ error: 'ownerAddress wajib diisi' });
    const contract = sc.deployPaymentContract(ownerAddress);
    res.json({ success: true, contract });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contract/payment/pay
router.post('/payment/pay', (req, res) => {
  try {
    const { contractId, fromAddress, serviceType, quantity } = req.body;
    if (!contractId || !fromAddress || !serviceType) {
      return res.status(400).json({ error: 'contractId, fromAddress, serviceType wajib diisi' });
    }
    const result = sc.executePayment(contractId, fromAddress, serviceType, quantity || 1);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;