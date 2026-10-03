// ==============================================================================
// KATALOG STATUS RESMI & NORMALISASI — MODUL MURNI (TANPA DEPENDENSI SUPABASE)
// Maharga Motor Showroom Management System
// ==============================================================================
// HARUS SINKRON 1:1 DENGAN CHECK CONSTRAINT DATABASE
// Sumber kebenaran: migrations/0008_fix_unit_status_tax_constraints.sql
//   units.status     : Tersedia | Perbaikan | Belum Tersedia | Titip DP / Tempo | Terjual
//   units.tax_status : Hidup | Mati Pajak   (legacy 'Mati' masih ditoleransi)
//
// Setiap nilai status baru di UI WAJIB ditambahkan ke migrasi 0008 juga,
// jika tidak unit akan ditolak database (error 23514) dan tidak tersimpan.
// Regresi ini dijaga otomatis oleh: node scripts/check-unit-status-parity.mjs
// ==============================================================================

export const UNIT_STATUSES = ['Tersedia', 'Perbaikan', 'Belum Tersedia', 'Titip DP / Tempo', 'Terjual'];
export const UNIT_TAX_STATUSES = ['Hidup', 'Mati Pajak'];

const LEGACY_STATUS_MAP = {
  'di bengkel': 'Perbaikan',
  'masuk bengkel': 'Perbaikan',
  'bengkel': 'Perbaikan',
  'perbaikan': 'Perbaikan',
  'belum tersedia': 'Belum Tersedia',
  'antrean': 'Belum Tersedia',
  'booking': 'Titip DP / Tempo',
  'dp': 'Titip DP / Tempo',
  'titip dp': 'Titip DP / Tempo',
  'tempo': 'Titip DP / Tempo',
  'sold': 'Terjual',
  'terjual': 'Terjual',
  'ready': 'Tersedia',
  'unit ready': 'Tersedia',
  'tersedia': 'Tersedia'
};

/** Samakan status UI dengan ejaan resmi yang diizinkan database. */
export const normalizeUnitStatus = (status) => {
  const raw = (status ?? '').toString().trim();
  if (UNIT_STATUSES.includes(raw)) return raw;
  const mapped = LEGACY_STATUS_MAP[raw.toLowerCase()];
  if (mapped) return mapped;
  // Nilai tak dikenal: jangan pernah diam-diam menandai unit "siap jual".
  console.warn(`[unitStatus] Status tidak dikenal: "${raw}" -> dialihkan ke "Belum Tersedia"`);
  return 'Belum Tersedia';
};

/** Samakan status pajak UI ('Mati') dengan ejaan resmi database ('Mati Pajak'). */
export const normalizeTaxStatus = (taxStatus) => {
  const raw = (taxStatus ?? '').toString().trim().toLowerCase();
  if (raw === 'mati' || raw === 'pajak mati' || raw === 'mati pajak') return 'Mati Pajak';
  return 'Hidup';
};

/**
 * ID unit numerik yang aman untuk kolom BIGSERIAL.
 * Date.now() saja bisa bertabrakan bila dua unit dibuat pada milidetik yang sama —
 * dengan upsert onConflict, unit berikutnya akan MENIMPA unit sebelumnya (data hilang).
 */
let unitIdCounter = 0;
export const generateUnitId = () => {
  unitIdCounter = (unitIdCounter + 1) % 1000;
  return Date.now() * 1000 + unitIdCounter * 10 + Math.floor(Math.random() * 10);
};

/** Ubah error PostgREST/PostgreSQL menjadi pesan yang bisa dimengerti operator. */
export const describeDbError = (error) => {
  if (!error) return '';
  const code = error.code || '';
  const msg = error.message || error.details || String(error);

  if (code === '23514') {
    if (/tax_status/i.test(msg)) {
      return 'Status pajak ditolak database (CHECK units_tax_status_check). Jalankan migrasi 0008, atau pilih "Pajak Hidup"/"Mati Pajak".';
    }
    if (/status/i.test(msg)) {
      return 'Status unit ditolak database (CHECK units_status_check). Jalankan migrations/0008_fix_unit_status_tax_constraints.sql.';
    }
    return `Data ditolak aturan validasi database (23514): ${msg}`;
  }
  if (code === '23505') return `Data duplikat — nomor polisi atau ID sudah dipakai unit lain (23505): ${msg}`;
  if (code === '23503') return `Referensi data tidak ditemukan (23503): ${msg}`;
  if (code === '23502') return `Ada field wajib yang kosong (23502): ${msg}`;
  if (code === '42501' || /row-level security/i.test(msg)) {
    return 'Akses ditolak RLS — sesi login Supabase sudah kedaluwarsa atau role tidak berhak. Silakan login ulang.';
  }
  if (code === 'PGRST204' || /could not find the '.*' column|schema cache/i.test(msg)) {
    return `Kolom belum ada di database (skema tertinggal): ${msg}`;
  }
  return msg;
};
