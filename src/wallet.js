const crypto = require('crypto');

// Generate address wallet simulasi (seperti Ethereum address)
function generateAddress() {
  return '0x' + crypto.randomBytes(20).toString('hex').toUpperCase();
}

// Generate private key simulasi
function generatePrivateKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Hash transaksi
function generateTxHash(from, to, amount) {
  const content = `${from}${to}${amount}${Date.now()}`;
  return '0x' + crypto.createHash('sha256').update(content).digest('hex').substring(0, 40);
}

// Storage wallet & transaksi di memory
let wallets = [
  {
    address: '0xHOSPITAL0000000000000000000000000000000',
    label: '🏥 Hospital Treasury',
    balance: 100000,
    privateKey: 'hospital-master-key',
    createdAt: new Date().toISOString(),
  }
];
let transactions = [];

function createWallet(label = 'Patient Wallet') {
  const wallet = {
    address: generateAddress(),
    label,
    balance: 50, // bonus MED coin awal untuk pasien baru
    privateKey: generatePrivateKey(),
    createdAt: new Date().toISOString(),
  };
  wallets.push(wallet);
  return wallet;
}

function sendMED(fromAddress, toAddress, amount) {
  const sender = wallets.find(w => w.address === fromAddress);
  const receiver = wallets.find(w => w.address === toAddress);

  if (!sender) throw new Error('Wallet pengirim tidak ditemukan');
  if (!receiver) throw new Error('Wallet penerima tidak ditemukan');
  if (sender.balance < amount) throw new Error('Saldo MED tidak cukup');
  if (amount <= 0) throw new Error('Jumlah harus lebih dari 0');

  sender.balance -= amount;
  receiver.balance += amount;

  const tx = {
    txHash: generateTxHash(fromAddress, toAddress, amount),
    from: fromAddress,
    fromLabel: sender.label,
    to: toAddress,
    toLabel: receiver.label,
    amount,
    coin: 'MED',
    timestamp: new Date().toISOString(),
    status: 'confirmed',
  };
  transactions.push(tx);
  return tx;
}

function getWallets() { return wallets; }
function getTransactions() { return transactions; }
function getWalletByAddress(address) { return wallets.find(w => w.address === address); }

module.exports = { createWallet, sendMED, getWallets, getTransactions, getWalletByAddress };