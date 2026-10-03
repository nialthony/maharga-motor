#!/usr/bin/env node
/**
 * MAHARGA MOTOR — MIGRASI FOTO BASE64 -> SUPABASE STORAGE
 *
 * Membaca foto berformat base64 (`data:image/...`) dari kolom `units.images`,
 * mengunggahnya ke bucket private 'showroom-assets', lalu mengganti isi kolom
 * tersebut dengan PATH storage (mis. ["units/1727_img_1_1699999999.jpg"]).
 *
 * Penggunaan:
 *   node scripts/migrate-images-to-storage.js <SECRET_KEY> [--dry-run] [--unit=<id>]
 *   # atau set environment:
 *   export SUPABASE_SERVICE_ROLE_KEY=<SECRET_KEY>
 *   node scripts/migrate-images-to-storage.js --dry-run
 *
 * Opsi:
 *   --dry-run        Pratinjau: tidak mengunggah & tidak mengubah database.
 *   --unit=<id>      Hanya proses satu unit (untuk uji coba sebelum jalan semua).
 *
 * Alur yang disarankan:
 *   1) --dry-run                     -> lihat jumlah unit & foto yang akan dipindah
 *   2) --unit=<id>                   -> uji pada SATU unit, cek di aplikasi
 *   3) (tanpa opsi)                  -> migrasi seluruh unit
 *
 * CATATAN TEKNIS — kenapa skrip ini memakai fetch() biasa, bukan supabase-js:
 *   createClient() selalu menginisialisasi klien Realtime, dan di Node < 22
 *   (tanpa WebSocket bawaan) itu melempar:
 *     "Node.js 20 detected without native WebSocket support."
 *   Skrip ini hanya butuh REST + Storage, jadi jalur HTTP langsung lebih
 *   sederhana sekaligus bebas dependensi: cukup Node 18+, tanpa `npm install`.
 *   Cocok untuk diserahkan ke pembeli (jalankan lewat `node`, bukan npm).
 *
 * AMANKAN DULU: skrip ini mengubah banyak baris sekaligus. Pastikan backup
 * harian (ops/backup-supabase.yml) sudah pernah sukses sebelum menjalankan
 * tanpa --dry-run.
 */

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://ouuxgwskivkugrndgsiv.supabase.co').replace(/\/+$/, '');
const KEY_PATTERNS = [/^sb_secret_/, /^eyJ/];   // secret key baru, atau service_role JWT lama
const isKeyLike = (value) => typeof value === 'string' && KEY_PATTERNS.some((re) => re.test(value));

// PENTING: hanya argumen yang BENTUKNYA key yang dipakai. Sebelumnya argv[2] diambil
// apa adanya, sehingga `... --dry-run` mengirim string "--dry-run" sebagai key dan
// API membalas "Invalid Compact JWS" — pesan yang menyesatkan seolah key-nya salah.
const ARGV_KEY = process.argv.slice(2).find(isKeyLike) || null;
const SERVICE_ROLE_KEY = ARGV_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const ONLY_UNIT = (process.argv.find((a) => a.startsWith('--unit=')) || '').split('=')[1] || null;
const BUCKET = 'showroom-assets';

// ---------------------------------------------------------------------------
// Validasi argumen
// ---------------------------------------------------------------------------
if (!SERVICE_ROLE_KEY) {
  console.error('\n❌ ERROR: Secret key Supabase diperlukan untuk menjalankan migrasi.');
  console.error('   Supabase Dashboard -> Settings -> API Keys -> Secret keys -> Create new secret key');
  console.error('   Jalankan: node scripts/migrate-images-to-storage.js <SECRET_KEY> --dry-run\n');
  process.exit(1);
}

if (SERVICE_ROLE_KEY.startsWith('sb_publishable_') || SERVICE_ROLE_KEY.startsWith('sbp_')) {
  console.error('\n❌ ERROR: Key yang dimasukkan bukan SECRET key.');
  console.error('   - "sb_publishable_..." = anon key (tunduk RLS, hanya untuk frontend)');
  console.error('   - "sbp_..."           = Personal Access Token (untuk Management API / CLI)');
  console.error('   Ambil SECRET key di: Settings -> API Keys -> Secret keys (awalan "sb_secret_")\n');
  process.exit(1);
}

if (!isKeyLike(SERVICE_ROLE_KEY)) {
  console.error('\n❌ ERROR: Bentuk secret key tidak dikenali.');
  console.error(`   Diterima: ${SERVICE_ROLE_KEY.slice(0, 12)}... (panjang ${SERVICE_ROLE_KEY.length})`);
  console.error('   Secret key yang benar diawali "sb_secret_" (format baru) atau "eyJ" (JWT service_role lama).');
  console.error('   Pastikan argumen pertama TIDAK berisi flag, contoh yang benar:');
  console.error('     node scripts/migrate-images-to-storage.js sb_secret_xxx --dry-run\n');
  process.exit(1);
}

const AUTH_HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`
};

// ---------------------------------------------------------------------------
// Pembantu HTTP + penerjemah error
// ---------------------------------------------------------------------------
const describeFailure = (status, body) => {
  const msg = body?.message || body?.error || body?.hint || '';
  if (status === 401 || /invalid compact jws|invalid api key/i.test(msg)) {
    return `${msg || 'Unauthorized'} — secret key tidak diterima. Pastikan key benar & belum dihapus (bukan publishable/anon key).`;
  }
  if (status === 403) return `${msg || 'Forbidden'} — key valid tetapi tidak berhak (RLS/policy).`;
  if (status === 404 && /bucket/i.test(msg)) return `${msg} — bucket '${BUCKET}' belum ada (jalankan tanpa --dry-run untuk membuatnya).`;
  if (status === 409) return `${msg || 'Conflict'} — objek sudah ada (pakai x-upsert bila ingin menimpa).`;
  return msg || `HTTP ${status}`;
};

async function api(path, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: { ...AUTH_HEADERS, ...headers },
    body
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const err = new Error(describeFailure(res.status, data));
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------
async function ensureBucket(log) {
  const buckets = await api('/storage/v1/bucket');
  const exists = Array.isArray(buckets) && buckets.some((b) => (b.id || b.name) === BUCKET);

  if (exists) {
    const bucket = buckets.find((b) => (b.id || b.name) === BUCKET);
    log(`✅ Bucket '${BUCKET}' ditemukan (private: ${bucket.public === false ? 'ya' : 'TIDAK'}, limit: ${bucket.file_size_limit ? (bucket.file_size_limit / 1024 / 1024) + ' MB' : '-'}).`);
    return;
  }

  if (DRY_RUN) {
    log(`ℹ️  [dry-run] Bucket '${BUCKET}' belum ada dan AKAN dibuat saat migrasi dijalankan.`);
    return;
  }

  log(`📦 Membuat bucket private '${BUCKET}'...`);
  await api('/storage/v1/bucket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: false,
      file_size_limit: 5242880,
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
    })
  });
  log(`✅ Bucket '${BUCKET}' dibuat.`);
}

async function uploadObject(storagePath, buffer, contentType) {
  return api(`/storage/v1/object/${BUCKET}/${storagePath.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'x-upsert': 'true',
      'cache-control': '3600'
    },
    body: buffer
  });
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
async function fetchUnits(log) {
  const PAGE = 500;
  const collected = [];

  for (let offset = 0; ; offset += PAGE) {
    let path = `/rest/v1/units?select=id,plate,brand,model,images&order=id.asc&limit=${PAGE}&offset=${offset}`;
    if (ONLY_UNIT) path += `&id=eq.${encodeURIComponent(ONLY_UNIT)}`;

    const page = await api(path);
    if (!Array.isArray(page) || page.length === 0) break;
    collected.push(...page);
    if (page.length < PAGE) break;
  }

  log(`📦 Ditemukan ${collected.length} unit motor${ONLY_UNIT ? ` (difilter: id=${ONLY_UNIT})` : ''}. Memeriksa foto base64...\n`);
  return collected;
}

async function updateUnitImages(unitId, images) {
  return api(`/rest/v1/units?id=eq.${encodeURIComponent(unitId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ images })
  });
}

// ---------------------------------------------------------------------------
// Proses utama
// ---------------------------------------------------------------------------
const log = (...args) => console.log(...args);

async function migrateImages() {
  log(`\n🚀 Migrasi foto base64 -> bucket '${BUCKET}'${DRY_RUN ? ' [MODE DRY-RUN: tidak ada perubahan ditulis]' : ''}`);
  log(`   Project: ${SUPABASE_URL}\n`);

  await ensureBucket(log);
  const units = await fetchUnits(log);

  let totalMigratedUnits = 0;
  let totalUploadedImages = 0;
  let totalFailed = 0;
  let bytesUploaded = 0;

  for (const unit of units) {
    const images = Array.isArray(unit.images) ? unit.images : [];
    const newImagePaths = [];
    let hasBase64 = false;

    for (let i = 0; i < images.length; i += 1) {
      const img = images[i];

      if (typeof img !== 'string' || !img.startsWith('data:image/')) {
        // Sudah berupa path storage, URL web, atau kosong -> pertahankan.
        newImagePaths.push(img);
        continue;
      }

      hasBase64 = true;

      const matches = img.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
      if (!matches) {
        log(`  ⚠️ Unit #${unit.id} foto ${i + 1}: format data URI tidak dikenali, dibiarkan.`);
        newImagePaths.push(img);
        continue;
      }

      const mime = matches[1];
      const ext = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const storagePath = `units/${unit.id}_img_${i + 1}_${Date.now()}.${ext}`;

      if (DRY_RUN) {
        log(`  🔍 [dry-run] #${unit.id} (${unit.plate}) foto ${i + 1}: ${(buffer.length / 1024).toFixed(0)} KB -> ${storagePath}`);
        newImagePaths.push(storagePath);
        totalUploadedImages += 1;
        bytesUploaded += buffer.length;
        continue;
      }

      try {
        await uploadObject(storagePath, buffer, mime);
        newImagePaths.push(storagePath);
        totalUploadedImages += 1;
        bytesUploaded += buffer.length;
        log(`  ✅ #${unit.id} (${unit.plate}) foto ${i + 1} -> ${storagePath} (${(buffer.length / 1024).toFixed(0)} KB)`);
      } catch (err) {
        // Gagal unggah: PERTAHANKAN base64 aslinya supaya tidak ada data hilang.
        log(`  ❌ #${unit.id} foto ${i + 1} gagal diunggah: ${err.message}`);
        newImagePaths.push(img);
        totalFailed += 1;
      }
    }

    if (!hasBase64) continue;

    const changed = JSON.stringify(newImagePaths) !== JSON.stringify(images);

    if (DRY_RUN) {
      totalMigratedUnits += 1;
      log(`  🔍 [dry-run] #${unit.id} (${unit.plate}) AKAN diperbarui (${newImagePaths.length} foto).\n`);
      continue;
    }

    if (!changed) {
      log(`  ℹ️  #${unit.id}: tidak ada perubahan yang perlu disimpan.\n`);
      continue;
    }

    try {
      await updateUnitImages(unit.id, newImagePaths);
      totalMigratedUnits += 1;
      log(`  💾 #${unit.id} (${unit.plate}) kolom images diperbarui di database.\n`);
    } catch (err) {
      log(`  ❌ #${unit.id} GAGAL memperbarui database: ${err.message}\n`);
      totalFailed += 1;
    }
  }

  log('----------------------------------------------------');
  log(DRY_RUN ? '🔍 DRY-RUN SELESAI (tidak ada perubahan yang ditulis):' : '🎉 MIGRASI SELESAI:');
  log(`   - Unit ${DRY_RUN ? 'yang akan diperbarui' : 'diperbarui'} : ${totalMigratedUnits}`);
  log(`   - Foto ${DRY_RUN ? 'yang akan diunggah' : 'diunggah'}   : ${totalUploadedImages}`);
  log(`   - Ukuran total                 : ${(bytesUploaded / 1024 / 1024).toFixed(1)} MB`);
  if (totalFailed > 0) log(`   - Gagal                        : ${totalFailed} (foto aslinya dipertahankan)`);
  log('----------------------------------------------------');
  if (DRY_RUN && totalUploadedImages > 0) {
    log('\nLangkah berikutnya (opsi bertahap yang lebih aman):');
    log('  1) uji satu unit dulu : node scripts/migrate-images-to-storage.js <SECRET_KEY> --unit=<id>');
    log('  2) setelah benar, jalankan seluruhnya (tanpa --dry-run / --unit).\n');
  }
}

migrateImages().catch((err) => {
  console.error(`\n❌ Migrasi dihentikan: ${err.message}`);
  if (err.stack && process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
