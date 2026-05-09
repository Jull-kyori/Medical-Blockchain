// server.js — tambahkan baris ini ke server.js yang sudah ada

const express    = require('express');
const cors       = require('cors');
const path       = require('path');

const blockchainRoutes = require('./routes/blockchainRoutes');
const walletRoutes     = require('./routes/walletRoutes');
const contractRoutes   = require('./routes/contractRoutes'); // ← TAMBAH INI

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/wallet',     walletRoutes);
app.use('/api/contract',   contractRoutes);  // ← TAMBAH INI

// Halaman HTML
app.get('/',         (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/wallet',   (req, res) => res.sendFile(path.join(__dirname, 'public/wallet.html')));
app.get('/contract', (req, res) => res.sendFile(path.join(__dirname, 'public/contract.html'))); // ← TAMBAH INI

app.listen(PORT, () => {
  console.log(`\n🏥 MedChain Server berjalan di: http://localhost:${PORT}`);
  console.log(`⛓️  Blockchain:     http://localhost:${PORT}/`);
  console.log(`💰  Wallet:         http://localhost:${PORT}/wallet`);
  console.log(`📜  Smart Contract: http://localhost:${PORT}/contract`);  // ← BARU
  console.log(`📡  API Contract:   http://localhost:${PORT}/api/contract\n`);
});