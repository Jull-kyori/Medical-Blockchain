const crypto = require('crypto');

function generateContractAddress() {
  return '0xCONTRACT_' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

function generateTxHash(...args) {
  return '0x' + crypto.createHash('sha256')
    .update(args.join('') + Date.now())
    .digest('hex').substring(0, 40);
}

function timestamp() { return new Date().toISOString(); }

let contracts    = [];
let contractLogs = [];

// ── INSURANCE ──────────────────────────────────────────
function deployInsuranceContract(ownerAddress, fundAmount) {
  const contract = {
    id: generateContractAddress(),
    type: 'InsuranceContract',
    name: '🏥 MedChain Insurance',
    owner: ownerAddress,
    state: { fund: fundAmount, totalClaimed: 0, claimCount: 0, isActive: true },
    rules: {
      'Normal': { claimAmount: 0, label: 'Tidak ada klaim' },
      'Heart Disease': {
        1: { claimAmount: 50,  label: 'Ringan' },
        2: { claimAmount: 100, label: 'Sedang' },
        3: { claimAmount: 200, label: 'Berat' },
        4: { claimAmount: 300, label: 'Sangat Berat' },
      },
    },
    deployedAt: timestamp(),
    txHash: generateTxHash(ownerAddress, fundAmount),
  };
  contracts.push(contract);
  _log(contract.id, 'DEPLOY', ownerAddress, `Contract deployed dengan dana ${fundAmount} MED`);
  return contract;
}

function executeInsuranceClaim(contractId, patientId, diagnosis, diagnosisLevel, walletAddress) {
  const contract = contracts.find(c => c.id === contractId && c.type === 'InsuranceContract');
  if (!contract) throw new Error('Contract tidak ditemukan');
  if (!contract.state.isActive) throw new Error('Contract sudah tidak aktif');

  let claimAmount = 0;
  let label = 'Tidak ada klaim';

  if (diagnosis === 'Heart Disease') {
    const level = Math.min(parseInt(diagnosisLevel) || 1, 4);
    const rule  = contract.rules['Heart Disease'][level];
    claimAmount = rule.claimAmount;
    label       = rule.label;
  }

  if (claimAmount === 0) {
    const log = _log(contractId, 'SKIP', walletAddress,
      `Pasien ${patientId} — ${diagnosis} — Tidak memenuhi syarat klaim`);
    return { success: true, claimed: false, amount: 0, message: 'Pasien sehat, tidak ada klaim', log };
  }

  if (contract.state.fund < claimAmount) throw new Error(`Dana tidak cukup. Tersisa: ${contract.state.fund} MED`);

  contract.state.fund         -= claimAmount;
  contract.state.totalClaimed += claimAmount;
  contract.state.claimCount   += 1;

  const txHash = generateTxHash(contractId, patientId, claimAmount);
  const log = _log(contractId, 'EXECUTE', walletAddress,
    `Klaim otomatis ${claimAmount} MED untuk pasien ${patientId} (${label})`);

  return { success: true, claimed: true, amount: claimAmount, level: label, txHash, log,
    message: `✅ Asuransi dicairkan: ${claimAmount} MED (${label})` };
}

// ── ACCESS CONTROL ─────────────────────────────────────
function deployAccessContract(ownerAddress) {
  const contract = {
    id: generateContractAddress(),
    type: 'AccessControl',
    name: '🔐 Medical Record Access Control',
    owner: ownerAddress,
    state: { accessList: {}, totalGrants: 0, totalRevokes: 0 },
    deployedAt: timestamp(),
    txHash: generateTxHash(ownerAddress, 'access'),
  };
  contracts.push(contract);
  _log(contract.id, 'DEPLOY', ownerAddress, 'AccessControl contract deployed');
  return contract;
}

function grantAccess(contractId, patientId, doctorAddress, grantedBy) {
  const contract = contracts.find(c => c.id === contractId && c.type === 'AccessControl');
  if (!contract) throw new Error('Contract tidak ditemukan');
  if (!contract.state.accessList[patientId]) contract.state.accessList[patientId] = [];
  if (contract.state.accessList[patientId].includes(doctorAddress)) throw new Error('Dokter sudah memiliki akses');
  contract.state.accessList[patientId].push(doctorAddress);
  contract.state.totalGrants += 1;
  const log = _log(contractId, 'GRANT', grantedBy, `Akses pasien ${patientId} diberikan ke ${doctorAddress}`);
  return { success: true, message: `✅ Akses diberikan ke ${doctorAddress}`, log };
}

function revokeAccess(contractId, patientId, doctorAddress, revokedBy) {
  const contract = contracts.find(c => c.id === contractId && c.type === 'AccessControl');
  if (!contract) throw new Error('Contract tidak ditemukan');
  const list = contract.state.accessList[patientId] || [];
  const idx  = list.indexOf(doctorAddress);
  if (idx === -1) throw new Error('Dokter tidak memiliki akses');
  list.splice(idx, 1);
  contract.state.totalRevokes += 1;
  const log = _log(contractId, 'REVOKE', revokedBy, `Akses pasien ${patientId} dicabut dari ${doctorAddress}`);
  return { success: true, message: `✅ Akses ${doctorAddress} dicabut`, log };
}

function checkAccess(contractId, patientId, doctorAddress) {
  const contract = contracts.find(c => c.id === contractId && c.type === 'AccessControl');
  if (!contract) throw new Error('Contract tidak ditemukan');
  const list = contract.state.accessList[patientId] || [];
  return { hasAccess: list.includes(doctorAddress), accessList: list };
}

// ── PAYMENT ────────────────────────────────────────────
function deployPaymentContract(ownerAddress) {
  const contract = {
    id: generateContractAddress(),
    type: 'PaymentContract',
    name: '💳 MED Auto Payment',
    owner: ownerAddress,
    state: { totalReceived: 0, paymentCount: 0, payments: [] },
    tariff: {
      'Konsultasi Umum': 10, 'Konsultasi Spesialis': 25,
      'Pemeriksaan Jantung': 50, 'Lab Darah': 15,
      'Rawat Inap (per hari)': 30, 'Operasi': 200, 'Obat-obatan': 20,
    },
    deployedAt: timestamp(),
    txHash: generateTxHash(ownerAddress, 'payment'),
  };
  contracts.push(contract);
  _log(contract.id, 'DEPLOY', ownerAddress, 'PaymentContract deployed');
  return contract;
}

function executePayment(contractId, fromAddress, serviceType, quantity = 1) {
  const contract = contracts.find(c => c.id === contractId && c.type === 'PaymentContract');
  if (!contract) throw new Error('Contract tidak ditemukan');
  const unitPrice = contract.tariff[serviceType];
  if (unitPrice === undefined) throw new Error(`Layanan "${serviceType}" tidak dikenal`);
  const total  = unitPrice * quantity;
  const txHash = generateTxHash(contractId, fromAddress, serviceType, total);
  contract.state.totalReceived += total;
  contract.state.paymentCount  += 1;
  contract.state.payments.push({ from: fromAddress, serviceType, quantity, unitPrice, total, txHash, paidAt: timestamp() });
  const log = _log(contractId, 'EXECUTE', fromAddress, `Pembayaran ${total} MED untuk ${serviceType} (x${quantity})`);
  return { success: true, txHash, serviceType, quantity, unitPrice, total,
    message: `✅ Pembayaran ${total} MED berhasil`, log };
}

// ── LOGGER & GETTERS ───────────────────────────────────
function _log(contractId, action, caller, description) {
  const log = { id: generateTxHash(contractId, action, caller), contractId, action, caller, description, timestamp: timestamp() };
  contractLogs.push(log);
  return log;
}

function getContracts()      { return contracts; }
function getContractById(id) { return contracts.find(c => c.id === id); }
function getLogs(contractId) { return contractId ? contractLogs.filter(l => l.contractId === contractId) : contractLogs; }

module.exports = {
  deployInsuranceContract, executeInsuranceClaim,
  deployAccessContract, grantAccess, revokeAccess, checkAccess,
  deployPaymentContract, executePayment,
  getContracts, getContractById, getLogs,
};