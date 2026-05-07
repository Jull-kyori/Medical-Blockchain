// Set default tanggal hari ini
document.getElementById('date').valueAsDate = new Date();

async function fetchChain() {
  try {
    const res = await fetch('/api/blockchain');
    const data = await res.json();
    renderChain(data.chain, data.isValid, data.length);
  } catch (e) {
    document.getElementById('chainContainer').innerHTML =
      '<div class="loading" style="color:red">❌ Gagal memuat blockchain. Pastikan server berjalan!</div>';
  }
}

function renderChain(chain, isValid, length) {
  // Update stats
  document.getElementById('statBlocks').textContent = length;
  document.getElementById('statPatients').textContent = Math.max(0, length - 1);
  document.getElementById('statValid').textContent = isValid ? '✅ Valid' : '❌ Tidak Valid';
  document.getElementById('chainStatus').textContent = isValid ? '✅ Chain Valid' : '❌ Chain Rusak!';
  document.getElementById('chainStatus').className = `badge ${isValid ? 'badge-green' : 'badge-red'}`;
  document.getElementById('chainLength').textContent = `${length} Blocks`;

  const container = document.getElementById('chainContainer');
  container.innerHTML = '';
  const chainDiv = document.createElement('div');
  chainDiv.className = 'chain';

  chain.forEach((block, i) => {
    const isGenesis = block.index === 0;
    const d = block.data;
    const diagClass = d.diagnosis === 'Normal' ? 'diag-normal' : 'diag-sick';

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
        <p>🔑 Hash: <span class="hash-val">${block.hash.substring(0, 24)}...</span></p>
        <p>⬅️ Prev: <span class="prev-val">${block.previousHash.substring(0, 24)}...</span></p>
        <p>🔢 Nonce: <b>${block.nonce}</b></p>
      </div>
      ${!isGenesis ? `
      <div class="block-data">
        <p>🆔 <b>${d.patientId}</b></p>
        <p>🎂 Umur: ${d.age} tahun | ${d.sex}</p>
        <p>🩺 Diagnosis: <span class="${diagClass}">${d.diagnosis}</span></p>
        ${d.cholesterol ? `<p>🩸 Kolesterol: ${d.cholesterol} | TD: ${d.restingBP || d.bp}</p>` : ''}
        <p>👨‍⚕️ ${d.doctor}</p>
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
  const alert = document.getElementById('loadAlert');
  btn.disabled = true;
  btn.textContent = '⏳ Sedang mining blocks...';
  alert.style.display = 'none';

  try {
    const res = await fetch('/api/blockchain/load-dataset', { method: 'POST' });
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
  const alertEl = document.getElementById('addAlert');
  btn.disabled = true;
  btn.textContent = '⛏️ Mining...';

  const data = {
    patientId:   document.getElementById('patientId').value || `MAN-${Date.now()}`,
    age:         parseInt(document.getElementById('age').value) || 0,
    sex:         document.getElementById('sex').value,
    diagnosis:   document.getElementById('diagnosis').value,
    cholesterol: document.getElementById('chol').value,
    restingBP:   document.getElementById('bp').value,
    doctor:      document.getElementById('doctor').value || 'Dr. Unknown',
    date:        document.getElementById('date').value,
  };

  try {
    const res = await fetch('/api/blockchain', {
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

function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  el.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// Load saat halaman dibuka
fetchChain();