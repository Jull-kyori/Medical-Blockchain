let allWallets = [];

async function fetchWallets() {
  const res = await fetch('/api/wallet');
  const data = await res.json();
  allWallets = data.wallets;
  renderWallets(data.wallets);
  renderTransactions(data.transactions);
  updateSelects(data.wallets);
}

function renderWallets(wallets) {
  const container = document.getElementById('walletList');
  container.innerHTML = wallets.map(w => `
    <div class="wallet-card">
      <div class="label">${w.label}</div>
      <div class="balance">${w.balance} <span style="font-size:0.9rem;">MED</span></div>
      <div class="address">${w.address}</div>
      <div style="font-size:0.7rem;opacity:0.7;margin-top:4px;">
        Dibuat: ${new Date(w.createdAt).toLocaleDateString('id-ID')}
      </div>
    </div>
  `).join('');
}

function renderTransactions(txs) {
  const container = document.getElementById('txList');
  if (!txs || txs.length === 0) {
    container.innerHTML = '<p style="color:#94a3b8;font-size:0.85rem;">Belum ada transaksi</p>';
    return;
  }
  container.innerHTML = [...txs].reverse().map(tx => `
    <div class="tx-item">
      <div class="tx-hash">${tx.txHash}</div>
      <div style="margin:4px 0;">
        <b>${tx.fromLabel}</b> → <b>${tx.toLabel}</b>
      </div>
      <div class="tx-amount">+${tx.amount} MED</div>
      <div style="font-size:0.72rem;color:#94a3b8;">
        ${new Date(tx.timestamp).toLocaleString('id-ID')} · ${tx.status}
      </div>
    </div>
  `).join('');
}

function updateSelects(wallets) {
  const from = document.getElementById('fromWallet');
  const to = document.getElementById('toWallet');
  const options = wallets.map(w =>
    `<option value="${w.address}">${w.label} (${w.balance} MED)</option>`
  ).join('');
  from.innerHTML = options;
  to.innerHTML = options;
}

function openCreateModal() {
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('newWalletInfo').style.display = 'none';
  document.getElementById('walletLabel').value = '';
}
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

async function createWallet() {
  const label = document.getElementById('walletLabel').value || 'Patient Wallet';
  const res = await fetch('/api/wallet/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label }),
  });
  const data = await res.json();
  if (data.success) {
    const info = document.getElementById('newWalletInfo');
    info.style.display = 'block';
    info.innerHTML = `
      ✅ Wallet berhasil dibuat!<br>
      <b>Address:</b> <span style="font-family:monospace;font-size:0.7rem;">${data.wallet.address}</span><br>
      <b>Saldo Awal:</b> ${data.wallet.balance} MED<br>
      <b>Private Key:</b> <span style="font-family:monospace;font-size:0.7rem;">${data.wallet.privateKey.substring(0,20)}...</span>
    `;
    await fetchWallets();
  }
}

async function sendMED() {
  const from = document.getElementById('fromWallet').value;
  const to = document.getElementById('toWallet').value;
  const amount = parseInt(document.getElementById('amount').value);

  if (from === to) return showAlert('sendAlert', 'error', '❌ Pengirim dan penerima tidak boleh sama!');
  if (!amount || amount <= 0) return showAlert('sendAlert', 'error', '❌ Jumlah MED harus lebih dari 0!');

  const res = await fetch('/api/wallet/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, amount }),
  });
  const data = await res.json();

  if (data.success) {
    showAlert('sendAlert', 'success', `✅ Transfer ${amount} MED berhasil! Tx: ${data.transaction.txHash.substring(0,20)}...`);
    await fetchWallets();
  } else {
    showAlert('sendAlert', 'error', `❌ ${data.error}`);
  }
}

function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  el.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

fetchWallets();