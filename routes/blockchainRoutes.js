const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { addBlock, addMultipleBlocks, getChainInfo } = require('../src/blockchain');

// GET /api/blockchain — ambil semua block
router.get('/', (req, res) => {
  res.json(getChainInfo());
});

// POST /api/blockchain — tambah 1 block manual
router.post('/', (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.patientId) {
      return res.status(400).json({ error: 'Data pasien tidak lengkap' });
    }
    const block = addBlock(data);
    res.json({ success: true, block });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/blockchain/load-dataset — load dataset UCI ke blockchain
router.post('/load-dataset', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../data/heart_disease.json');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File heart_disease.json tidak ditemukan. Jalankan convert_dataset.js dulu!' });
    }
    const records = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Ambil 20 data pertama agar tidak terlalu lama mining
    const sample = records.slice(0, 20);
    const added = addMultipleBlocks(sample);
    res.json({ success: true, addedBlocks: added.length, message: `${added.length} records dari UCI dataset berhasil dimasukkan ke blockchain!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;