#!/usr/bin/env node
/**
 * check-unit-status-parity.mjs
 * ---------------------------------------------------------------------------
 * Penjaga regresi: memastikan SEMUA nilai status unit / status pajak yang bisa
 * ditulis oleh UI benar-benar diizinkan oleh CHECK constraint di database.
 *
 * Latar belakang bug: commit 908aaf1 menambahkan status 'Perbaikan' dan
 * 'Belum Tersedia' di UI, tetapi CHECK constraint di database masih hanya
 * mengizinkan ('Tersedia', 'Titip DP / Tempo', 'Terjual') => setiap penyimpanan
 * unit dengan status bengkel ditolak database (error 23514) dan hilang setelah
 * halaman di-refresh.
 *
 * Jalankan:  node scripts/check-unit-status-parity.mjs
 * Exit code 1 bila ditemukan ketidakcocokan (cocok untuk CI / pre-deploy).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATION_FILE = 'migrations/0008_fix_unit_status_tax_constraints.sql';

const read = (relPath) => readFileSync(join(ROOT, relPath), 'utf8');

/** Baca daftar nilai dari file migrasi: CHECK (kolom IN ('a','b',...)) */
const parseConstraintValues = (sql, constraintName) => {
  const block = sql.match(new RegExp(`ADD CONSTRAINT ${constraintName}\\s+CHECK \\([^)]*\\(([^)]*)\\)`, 's'));
  if (!block) return [];
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
};

const walk = (dir, acc = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.(jsx?|tsx?)$/.test(entry)) acc.push(full);
  }
  return acc;
};

const dbStatuses = parseConstraintValues(read(MIGRATION_FILE), 'units_status_check');
const dbTaxStatuses = parseConstraintValues(read(MIGRATION_FILE), 'units_tax_status_check');

if (dbStatuses.length === 0 || dbTaxStatuses.length === 0) {
  console.error(`❌ Tidak bisa membaca daftar status dari ${MIGRATION_FILE}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Kumpulkan seluruh nilai yang BISA ditulis UI (write-path + filter katalog)
// ---------------------------------------------------------------------------
const uiWrites = new Set();
const uiTaxWrites = new Set();

const collectMatches = (text, regex, target, group = 1) => {
  for (const m of text.matchAll(regex)) {
    if (m[group]) target.add(m[group]);
  }
};

for (const file of walk(join(ROOT, 'src'))) {
  const text = readFileSync(file, 'utf8');
  const rel = file.replace(`${ROOT}/`, '');

  // 1. Tombol alur status unit di NewUnitModal: setStatus('Perbaikan')
  collectMatches(text, /setStatus\('([^']+)'\)/g, uiWrites);

  // 2. Aksi bengkel: onUpdateUnitStatus(id, 'Tersedia')
  collectMatches(text, /onUpdateUnitStatus\([^,]+,\s*'([^']+)'\)/g, uiWrites);

  // 3. Status unit hasil transaksi kasir POS
  if (/onTransactionComplete\(/.test(text)) {
    const call = text.slice(text.indexOf('onTransactionComplete('), text.indexOf('onTransactionComplete(') + 400);
    collectMatches(call, /'((?:Tersedia|Terjual|Perbaikan|Belum Tersedia|Titip DP \/ Tempo))'/g, uiWrites);
  }

  // 4. Filter status pada katalog Inventory (harus cocok dengan isi database)
  if (rel.endsWith('Inventory.jsx')) {
    const filterBlock = text.slice(text.indexOf('Semua Status Unit'), text.indexOf('Semua Status Unit') + 700);
    for (const m of filterBlock.matchAll(/<option value="([^"]+)"/g)) {
      if (m[1] !== 'All') uiWrites.add(m[1]);
    }
  }

  // 5. Status pajak: opsi dropdown + kondisi pajak mati
  collectMatches(text, /<option value="(Hidup|Mati Pajak|Mati)"/g, uiTaxWrites);
}

// ---------------------------------------------------------------------------
// Bandingkan
// ---------------------------------------------------------------------------
const report = (label, uiValues, dbValues) => {
  const missing = [...uiValues].filter((v) => !dbValues.includes(v));
  console.log(`\n${label}`);
  console.log(`  UI  : ${[...uiValues].sort().join(', ') || '(tidak terdeteksi)'}`);
  console.log(`  DB  : ${[...dbValues].sort().join(', ')}`);
  if (missing.length > 0) {
    console.log(`  ❌ DITOLAK DATABASE: ${missing.join(', ')}`);
    return missing;
  }
  console.log('  ✅ Sinkron');
  return [];
};

console.log('=== PARITAS STATUS UI ↔ CHECK CONSTRAINT DATABASE ===');
const missingStatus = report('units.status', uiWrites, dbStatuses);
const missingTax = report('units.tax_status', uiTaxWrites, dbTaxStatuses);

// ---------------------------------------------------------------------------
// Uji cepat fungsi normalisasi di src/lib/cloudStore.js
// ---------------------------------------------------------------------------
console.log('\n=== UJI NORMALISASI (src/lib/unitStatus.js) ===');
const {
  normalizeUnitStatus,
  normalizeTaxStatus,
  generateUnitId,
  describeDbError
} = await import(join(ROOT, 'src/lib/unitStatus.js'));

const cases = [
  ['Perbaikan', 'Perbaikan'],
  ['Di Bengkel', 'Perbaikan'],
  ['Belum Tersedia', 'Belum Tersedia'],
  ['Titip DP / Tempo', 'Titip DP / Tempo'],
  ['Terjual', 'Terjual'],
  ['Tersedia', 'Tersedia']
];
let failed = 0;
for (const [input, expected] of cases) {
  const actual = normalizeUnitStatus(input);
  const ok = actual === expected;
  if (!ok) failed += 1;
  console.log(`  ${ok ? '✅' : '❌'} status "${input}" -> "${actual}" (harap: "${expected}")`);
}

const taxCases = [['Mati', 'Mati Pajak'], ['Mati Pajak', 'Mati Pajak'], ['Hidup', 'Hidup'], ['', 'Hidup']];
for (const [input, expected] of taxCases) {
  const actual = normalizeTaxStatus(input);
  const ok = actual === expected;
  if (!ok) failed += 1;
  console.log(`  ${ok ? '✅' : '❌'} tax_status "${input}" -> "${actual}" (harap: "${expected}")`);
}

// ID harus unik walau dibuat berturut-turut pada milidetik yang sama
const ids = new Set(Array.from({ length: 500 }, () => generateUnitId()));
const idOk = ids.size === 500;
if (!idOk) failed += 1;
console.log(`  ${idOk ? '✅' : '❌'} 500 ID berturut-turut unik (${ids.size}/500)`);

// Pesan error harus menjelaskan penyebab 23514
const msg = describeDbError({ code: '23514', message: 'new row violates check constraint "units_status_check"' });
const errOk = /status unit ditolak database/i.test(msg);
if (!errOk) failed += 1;
console.log(`  ${errOk ? '✅' : '❌'} describeDbError(23514) memberi instruksi migrasi 0008`);

console.log('');
if (missingStatus.length || missingTax.length || failed) {
  console.error('❌ GAGAL: ada status UI yang tidak diizinkan database, atau normalisasi bermasalah.');
  console.error('   Tambahkan nilainya ke migrations/0008_fix_unit_status_tax_constraints.sql lalu jalankan ulang migrasi.');
  process.exit(1);
}
console.log('✅ LULUS: semua status UI diizinkan database dan normalisasi berjalan benar.');
