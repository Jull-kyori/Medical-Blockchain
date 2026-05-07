// convert_dataset.js — jalankan: node convert_dataset.js
const fs = require('fs');

const csv = fs.readFileSync('./data/heart_disease_uci.csv', 'utf-8');
const lines = csv.trim().split('\n');
const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

const records = lines.slice(1).map((line, i) => {
  const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
  const obj = {};
  headers.forEach((h, idx) => { obj[h] = values[idx]; });

  return {
    patientId: `UCI-${String(i + 1).padStart(4, '0')}`,
    age: parseInt(obj.age) || 0,
    sex: obj.sex || 'Unknown',
    dataset: obj.dataset || 'Unknown',
    chestPainType: obj.cp || '-',
    restingBP: obj.trestbps || '-',
    cholesterol: obj.chol || '-',
    maxHeartRate: obj.thalach || '-',
    diagnosis: parseInt(obj.num) > 0 ? 'Heart Disease' : 'Normal',
    diagnosisLevel: parseInt(obj.num) || 0,
    doctor: 'Dr. System',
    date: new Date().toISOString().split('T')[0],
  };
});

fs.writeFileSync('./data/heart_disease.json', JSON.stringify(records, null, 2));
console.log(`✅ Berhasil konversi ${records.length} records ke heart_disease.json`);