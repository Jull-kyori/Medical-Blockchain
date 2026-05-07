const express = require('express');
const cors = require('cors');
const path = require('path');

const blockchainRoutes = require('./routes/blockchainRoutes');
const walletRoutes = require('./routes/walletRoutes');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes API
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/wallet', walletRoutes);

// Halaman HTML
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/wallet', (req, res) => res.sendFile(path.join(__dirname, 'public/wallet.html')));

// Start server
app.listen(PORT, () => {
  console.log(`\n🏥 MedChain Server berjalan di: http://localhost:${PORT}`);
  console.log(`⛓️  Blockchain:  http://localhost:${PORT}/`);
  console.log(`💰  Wallet:      http://localhost:${PORT}/wallet`);
  console.log(`📡  API:         http://localhost:${PORT}/api/blockchain\n`);
});