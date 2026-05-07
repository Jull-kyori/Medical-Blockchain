const crypto = require('crypto');

/**
 * Hitung hash SHA-256 dari sebuah block
 */
function calculateHash(index, timestamp, data, previousHash, nonce) {
  const content = `${index}${timestamp}${JSON.stringify(data)}${previousHash}${nonce}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Mining: Proof of Work
 * Cari nonce sampai hash dimulai dengan sejumlah '0'
 */
function mineBlock(index, timestamp, data, previousHash, difficulty = 2) {
  let nonce = 0;
  let hash = '';
  const target = '0'.repeat(difficulty);

  do {
    nonce++;
    hash = calculateHash(index, timestamp, data, previousHash, nonce);
  } while (!hash.startsWith(target));

  return { hash, nonce };
}

/**
 * Buat Genesis Block (block pertama)
 */
function createGenesisBlock() {
  const data = {
    patientId: 'GENESIS',
    age: 0,
    sex: '-',
    diagnosis: 'System Initialized',
    doctor: 'System',
    date: new Date().toISOString().split('T')[0],
  };
  const timestamp = new Date().toISOString();
  const { hash, nonce } = mineBlock(0, timestamp, data, '0'.repeat(64));
  return { index: 0, timestamp, data, previousHash: '0'.repeat(64), hash, nonce };
}

/**
 * Validasi apakah seluruh chain masih valid
 */
function isChainValid(chain) {
  for (let i = 1; i < chain.length; i++) {
    const current = chain[i];
    const previous = chain[i - 1];

    const recalculated = calculateHash(
      current.index, current.timestamp, current.data,
      current.previousHash, current.nonce
    );

    if (current.hash !== recalculated) return false;
    if (current.previousHash !== previous.hash) return false;
  }
  return true;
}

// State blockchain di memory
let blockchain = [createGenesisBlock()];

/**
 * Tambah block baru dari data record medis
 */
function addBlock(patientData) {
  const previousBlock = blockchain[blockchain.length - 1];
  const index = blockchain.length;
  const timestamp = new Date().toISOString();
  const { hash, nonce } = mineBlock(index, timestamp, patientData, previousBlock.hash);

  const newBlock = {
    index,
    timestamp,
    data: patientData,
    previousHash: previousBlock.hash,
    hash,
    nonce,
  };

  blockchain.push(newBlock);
  return newBlock;
}

/**
 * Tambah banyak block sekaligus (untuk load dataset)
 */
function addMultipleBlocks(records) {
  const added = [];
  for (const record of records) {
    added.push(addBlock(record));
  }
  return added;
}

function getChain() { return blockchain; }
function getChainInfo() {
  return { chain: blockchain, length: blockchain.length, isValid: isChainValid(blockchain) };
}

module.exports = { addBlock, addMultipleBlocks, getChain, getChainInfo, isChainValid };