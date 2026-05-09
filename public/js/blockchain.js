document.getElementById('date').valueAsDate = new Date();

document.getElementById('diagnosis').addEventListener('change', function () {
  document.getElementById('levelGroup').style.display =
    this.value === 'Heart Disease' ? 'block' : 'none';
});

async function fetchChain() {
  try {
    const res  = await fetch('/api/blockchain');
    const data = await res.json();
    renderChain(data.chain, data.isValid, data.length);
  } catch (e) {
    document.getElementById('chainContainer').innerHTML =
      '<div class="loading" style="color:red">❌ Gagal memuat blockchain!</div>';
  }
}

function renderChain(chain, isValid, length) {
  document.getElementById('statBlocks').textContent   = length;
  document.getElementById('statPatients').textContent = Math.max(0, length - 1);
  document.getElementById('statValid').textContent    = isValid ? '✅ Valid' : '❌ Tidak Valid';
  document.getElementById('chainStatus').textContent  = isValid ? '✅ Chain Valid' : '❌ Chain Rusak!';
  document.getElementById('chainStatus').className    = `badge ${isValid ? 'badge-green' : 'badge-red'}`;
  document.getElementById('chainLength').textContent  = `${length} Blocks`;

  const container = document.getElementById('chainContainer');
  container.innerHTML = '';
  const chainDiv = document.createElement('div');
  chainDiv.className = 'chain';

  chain.forEach((block, i) => {
    const isGenesis = block.index === 0;
    const d         = block.data;
    const diagClass = d.diagnosis === 'Normal' ? 'diag-normal' : 'diag-sick';

    const claimBtn = (!isGenesis && d.diagnosis === 'Heart Disease')
      ? `<button onclick="openClaimModal('${d.patientId}','${d.diagnosis}',${d.diagnosisLevel || 1})"
           style="margin-top:8px;width:100%;padding:6px;background:#16a34a;color:white;
                  border:none;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;">
           🏥 Klaim Asuransi Otomatis
         </button>`
      : '';

    const blockEl = document.createElement('div');
    blockEl.className = `block${isGenesis ? ' genesis' : ''}`;
    blockEl.innerHTML = `
      <div class="block-header">
        <span class="block-index">Block #${block.index}</span>
        <span class="badge ${isGenesis ? 'badge-blue' : 'badge-green'}">
          ${isGenesis ? '🌟 Genesis' : '🩺 Medical'}
        </span>
      </div>
      <div class="block-hashes">
        <p>🔑 Hash: <span class="hash-val">${block.hash.substring(0,24)}...</span></p>
        <p>⬅️ Prev: <span class="prev-val">${block.previousHash.substring(0,24)}...</span></p>
        <p>🔢 Nonce: <b>${block.nonce}</b></p>
      </div>
      ${!isGenesis ? `
      <div class="block-data">
        <p>🆔 <b>${d.patientId}</b></p>
        <p>🎂 Umur: ${d.age} tahun | ${d.sex}</p>
        <p>🩺 Diagnosis: <span class="${diagClass}">${d.diagnosis}</span>
          ${d.diagnosisLevel ? `<span style="font-size:0.75rem;color:#64748b;">(Level ${d.diagnosisLevel})</span>` : ''}
        </p>
        ${d.cholesterol ? `<p>🩸 Kolesterol: ${d.cholesterol} | TD: ${d.restingBP || d.bp || '-'}</p>` : ''}
        <p>👨‍⚕️ ${d.doctor}</p>
        ${claimBtn}
      </div>` : `<div class="block-data"><p style="color:#92400e">🌟 Blok awal blockchain</p></div>`}
      <p class="block-time">⏰ ${new Date(block.timestamp).toLocaleString('id-ID')}</p>
    `;

    chainDiv.appendChild(blockEl);
    if (i < chain.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'arrow';
      arrow.textContent = '⬇️';
      chainDiv.appendChild(arrow);
    }
  });

  container.appendChild(chainDiv);
}

async function loadDataset() {
  const btn = document.getElementById('btnLoad');
  btn.disabled = true;
  btn.textContent = '⏳ Sedang mining blocks...';
  try {
    const res  = await fetch('/api/blockchain/load-dataset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showAlert('loadAlert', 'success', `✅ ${data.message}`);
      await fetchChain();
    } else {
      showAlert('loadAlert', 'error', `❌ ${data.error}`);
    }
  } catch (e) {
    showAlert('loadAlert', 'error', '❌ Gagal memuat dataset!');
  } finally {
    btn.disabled = false;
    btn.textContent = '📥 Load Heart Disease Dataset';
  }
}

async function addRecord() {
  const btn = document.getElementById('btnAdd');
  btn.disabled = true;
  btn.textContent = '⛏️ Mining...';

  const diagnosis      = document.getElementById('diagnosis').value;
  const diagnosisLevel = diagnosis === 'Heart Disease'
    ? parseInt(document.getElementById('diagnosisLevel').value) : 0;

  const data = {
    patientId:      document.getElementById('patientId').value || `MAN-${Date.now()}`,
    age:            parseInt(document.getElementById('age').value) || 0,
    sex:            document.getElementById('sex').value,
    diagnosis,
    diagnosisLevel,
    cholesterol:    document.getElementById('chol').value,
    restingBP:      document.getElementById('bp').value,
    doctor:         document.getElementById('doctor').value || 'Dr. Unknown',
    date:           document.getElementById('date').value,
  };

  try {
    const res    = await fetch('/api/blockchain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      showAlert('addAlert', 'success', `✅ Block #${result.block.index} berhasil ditambahkan!`);
      await fetchChain();
    } else {
      showAlert('addAlert', 'error', `❌ ${result.error}`);
    }
  } catch (e) {
    showAlert('addAlert', 'error', '❌ Gagal menambahkan block!');
  } finally {
    btn.disabled = false;
    btn.textContent = '⛏️ Mine & Tambah Block';
  }
}

let claimData = {};

async function openClaimModal(patientId, diagnosis, diagnosisLevel) {
  claimData = { patientId, diagnosis, diagnosisLevel };
  const claimAmounts = { 1: 50, 2: 100, 3: 200, 4: 300 };
  const claimLabels  = { 1: 'Ringan', 2: 'Sedang', 3: 'Berat', 4: 'Sangat Berat' };
  const level = Math.min(parseInt(diagnosisLevel) || 1, 4);

  document.getElementById('claimPatientInfo').innerHTML = `
    🆔 <b>Patient:</b> ${patientId}<br>
    🩺 <b>Diagnosis:</b> ${diagnosis}<br>
    📊 <b>Level:</b> ${level} — ${claimLabels[level]}<br>
    💰 <b>Estimasi Klaim:</b> <span style="color:#16a34a;font-weight:700;">${claimAmounts[level]} MED</span>
  `;

  const res  = await fetch('/api/contract');
  const data = await res.json();
  const insuranceContracts = data.contracts.filter(c => c.type === 'InsuranceContract');
  const sel = document.getElementById('claimContractId');
  sel.innerHTML = insuranceContracts.length
    ? insuranceContracts.map(c =>
        `<option value="${c.id}">${c.name} — Dana: ${c.state.fund} MED</option>`
      ).join('')
    : '<option value="">⚠️ Belum ada Insurance Contract!</option>';

  document.getElementById('claimResult').style.display = 'none';
  document.getElementById('claimModal').style.display  = 'flex';
}

function closeClaimModal() {
  document.getElementById('claimModal').style.display = 'none';
}

async function submitClaim() {
  const contractId    = document.getElementById('claimContractId').value;
  const walletAddress = document.getElementById('claimWallet').value;
  const resultEl      = document.getElementById('claimResult');

  if (!contractId) {
    resultEl.style.cssText = 'display:block;background:#fee2e2;color:#991b1b;padding:10px;border-radius:8px;';
    resultEl.textContent   = '❌ Pilih Insurance Contract dulu!';
    return;
  }

  try {
    const res  = await fetch('/api/contract/insurance/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractId,
        patientId:      claimData.patientId,
        diagnosis:      claimData.diagnosis,
        diagnosisLevel: claimData.diagnosisLevel,
        walletAddress:  walletAddress || 'unknown',
      }),
    });
    const data = await res.json();
    if (data.success && data.claimed) {
      resultEl.style.cssText = 'display:block;background:#dcfce7;color:#166534;padding:12px;border-radius:8px;font-size:0.83rem;';
      resultEl.innerHTML = `
        ✅ <b>Klaim berhasil dicairkan!</b><br>
        💰 Jumlah: <b>${data.amount} MED</b><br>
        📊 Level: ${data.level}<br>
        🔑 TxHash: <code style="font-size:0.7rem;">${data.txHash}</code>
      `;
    } else if (data.success && !data.claimed) {
      resultEl.style.cssText = 'display:block;background:#fef9c3;color:#854d0e;padding:10px;border-radius:8px;';
      resultEl.textContent = `ℹ️ ${data.message}`;
    } else {
      resultEl.style.cssText = 'display:block;background:#fee2e2;color:#991b1b;padding:10px;border-radius:8px;';
      resultEl.textContent = `❌ ${data.error}`;
    }
  } catch (e) {
    resultEl.style.cssText = 'display:block;background:#fee2e2;color:#991b1b;padding:10px;border-radius:8px;';
    resultEl.textContent = '❌ Gagal eksekusi klaim!';
  }
}

function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  el.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

fetchChain();