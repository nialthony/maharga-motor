/**
 * Uji logika P0-1 (foto base64 -> Supabase Storage) tanpa browser & tanpa network.
 * Jalankan: node --import ./test/register-loader.mjs test/imageStorage.test.mjs
 */
import assert from 'node:assert/strict';
import { calls } from './supabase-stub.mjs';

const mod = await import('../src/lib/imageStorage.js');
const {
  isStoragePath, resolveImageUrl, resolveImageUrls, clearImageCache,
  dataUrlToBlob, uploadUnitPhoto, removeUnitPhoto
} = mod;

let pass = 0;
const ok = (label, cond) => {
  if (!cond) throw new Error(`GAGAL: ${label}`);
  pass += 1;
  console.log(`  ✓ ${label}`);
};

// ---------------------------------------------------------------- 1. Deteksi path
console.log('\n1. isStoragePath — mana yang perlu ditukar jadi Signed URL');
ok('path storage "units/1727_foto.jpg" -> true', isStoragePath('units/1727_foto.jpg') === true);
ok('URL web (unsplash) -> false (dilewatkan)', isStoragePath('https://images.unsplash.com/x.jpg') === false);
ok('base64 lama "data:image/..." -> false (tetap tampil)', isStoragePath('data:image/jpeg;base64,AAA') === false);
ok('blob: URL -> false', isStoragePath('blob:http://x/y') === false);
ok('path absolut "/logo.png" -> false', isStoragePath('/logo.png') === false);
ok('string kosong -> false', isStoragePath('') === false);
ok('null -> false', isStoragePath(null) === false);

// ---------------------------------------------------------------- 2. Batching
console.log('\n2. Batching — 6 foto sekaligus harus jadi 1 request, bukan 6');
clearImageCache();
const paths = Array.from({ length: 6 }, (_, i) => `units/unit_${i}.jpg`);

const before = calls.batchSigned;
const urls = await Promise.all(paths.map(resolveImageUrl));
const batchDelta = calls.batchSigned - before;

ok(`6 path -> ${batchDelta} panggilan createSignedUrls (harap 1)`, batchDelta === 1);
ok('semua path mendapat URL', urls.every((u) => u.startsWith('https://cdn.test/signed/')));
ok('URL sesuai path masing-masing', urls[3].includes('units/unit_3.jpg'));

// ---------------------------------------------------------------- 3. Cache
console.log('\n3. Cache — render ulang tidak menambah request (hemat egress)');
const beforeCache = calls.batchSigned;
const again = await Promise.all(paths.map(resolveImageUrl));
ok(`percobaan kedua -> ${calls.batchSigned - beforeCache} request baru (harap 0)`, calls.batchSigned === beforeCache);
ok('URL dari cache tetap sama', again[0] === urls[0]);

// ---------------------------------------------------------------- 4. Passthrough
console.log('\n4. Passthrough — nilai lama tidak menambah request sama sekali');
const beforePass = calls.batchSigned + calls.singleSigned;
const passthrough = await Promise.all([
  resolveImageUrl('https://images.unsplash.com/photo.jpg'),
  resolveImageUrl('data:image/jpeg;base64,AAAA'),
  resolveImageUrl(''),
  resolveImageUrl(null)
]);
ok('URL web dikembalikan apa adanya', passthrough[0] === 'https://images.unsplash.com/photo.jpg');
ok('base64 lama dikembalikan apa adanya', passthrough[1].startsWith('data:image/jpeg'));
ok('kosong -> string kosong (tidak error)', passthrough[2] === '' && passthrough[3] === '');
ok('tidak ada request tambahan', calls.batchSigned + calls.singleSigned === beforePass);

// ---------------------------------------------------------------- 5. resolveImageUrls
console.log('\n5. resolveImageUrls — versi massal (untuk ekspor/laporan)');
clearImageCache();
const beforeMass = calls.batchSigned;
const mass = await resolveImageUrls(['units/a.jpg', 'units/b.jpg']);
ok(`2 path -> ${calls.batchSigned - beforeMass} panggilan (harap 1)`, calls.batchSigned - beforeMass === 1);
ok('keduanya teresolusi', mass.every((u) => u.includes('cdn.test')));

// ---------------------------------------------------------------- 6. Unggah
console.log('\n6. uploadUnitPhoto — yang dikembalikan adalah PATH, bukan base64');
const dataBlob = dataUrlToBlob('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==');
ok('dataUrlToBlob menghasilkan Blob', dataBlob instanceof Blob && dataBlob.size > 0);
ok('MIME dipertahankan (image/png)', dataBlob.type === 'image/png');

const uploadBefore = calls.uploads;
const uploadedPath = await uploadUnitPhoto(dataBlob, 'units');
ok(`upload dipanggil 1x (delta ${calls.uploads - uploadBefore})`, calls.uploads - uploadBefore === 1);
ok(`hasil berupa path storage, bukan base64 -> "${uploadedPath}"`, isStoragePath(uploadedPath) && !uploadedPath.startsWith('data:'));
ok('path diawali "units/"', uploadedPath.startsWith('units/'));

// ---------------------------------------------------------------- 7. Hapus objek
console.log('\n7. removeUnitPhoto — hanya berkas storage yang dihapus');
const rmBefore = calls.removes;
const removed = await removeUnitPhoto(uploadedPath);
ok('berkas storage dihapus (1x)', calls.removes - rmBefore === 1 && removed === true);

const rmBefore2 = calls.removes;
const removedWeb = await removeUnitPhoto('https://images.unsplash.com/x.jpg');
ok('URL web TIDAK dihapus dari storage', calls.removes === rmBefore2 && removedWeb === false);

// ---------------------------------------------------------------- 8. Fallback
console.log('\n8. Ketahanan — batch gagal harus jatuh ke per-berkas, bukan gagal total');
clearImageCache();
// Paksa createSignedUrls gagal untuk memastikan ada jalur cadangan per-berkas.
let forced = false;
const patchedSupabase = (await import('./supabase-stub.mjs')).supabase;
const origFrom = patchedSupabase.storage.from.bind(patchedSupabase.storage);
patchedSupabase.storage.from = (bucket) => {
  const api = origFrom(bucket);
  return { ...api, createSignedUrls: async () => { forced = true; return { data: null, error: { message: 'simulasi kegagalan batch' } }; } };
};
const singleBefore = calls.singleSigned;
const fallbackUrl = await resolveImageUrl('units/fallback_test.jpg');
ok('batch gagal -> memakai jalur per-berkas', forced === true && calls.singleSigned > singleBefore);
ok('URL tetap didapat lewat fallback', String(fallbackUrl).includes('/single/units/fallback_test.jpg'));

console.log(`\n✅ SEMUA ${pass} PEMERIKSAAN LULUS\n`);
