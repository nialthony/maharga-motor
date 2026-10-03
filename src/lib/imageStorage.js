// ==============================================================================
// PENGELOLA FOTO UNIT — SUPABASE PRIVATE STORAGE (P0-1)
// Maharga Motor Showroom Management System
// ==============================================================================
// LATAR BELAKANG MASALAH YANG DISELESAIKAN:
//   Sebelumnya foto unit disimpan sebagai data URI base64 DI DALAM kolom
//   units.images (sampai ±1 MB per unit). Akibatnya:
//     - Setiap buka aplikasi mengunduh SEMUA base64  -> kuota egress Supabase
//       (5 GB/bulan di Free) bisa habis hanya dengan 2-3 kali buka per hari.
//     - Kapasitas database 500 MB habis di ratusan unit.
//     - localStorage browser (kuota ±5 MB) penuh setelah belasan unit.
//
//   Sekarang: foto diunggah ke bucket private 'showroom-assets' dan yang
//   disimpan di database hanyalah PATH-nya (mis. "units/1727_foto.jpg").
//   Gambar ditampilkan lewat Signed URL (berlaku 1 jam) yang di-cache di memori
//   supaya tidak minta URL baru di setiap render.
//
// Jalur data:
//   unggah : File/Blob -> (kompres) -> storage 'showroom-assets'  -> simpan path
//   tampil : path -> cek cache -> (createSignedUrls batch) -> <img src="signed">
//   nilai yang sudah berupa http(s)/data:/blob: DILEWATKAN apa adanya
//   (mendukung foto lama berbasis URL web maupun sisa base64 sebelum migrasi).
// ==============================================================================

import { supabase, uploadImageToStorage } from './supabaseClient';

export const STORAGE_BUCKET = 'showroom-assets';

const SIGNED_URL_TTL_SECONDS = 3600;              // masa berlaku di server: 1 jam
const CACHE_TTL_MS = 45 * 60 * 1000;              // cache lokal: 45 menit
const COMPRESS_MAX_DIM = 1200;                    // sisi terpanjang (px)
const COMPRESS_QUALITY = 0.82;                    // kualitas JPEG

// ------------------------------------------------------------------------------
// 1. DETEKSI & CACHE
// ------------------------------------------------------------------------------

/** True bila nilai adalah PATH storage (bukan URL web / base64 / path absolut). */
export const isStoragePath = (value) => {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  return !/^(https?:|data:|blob:|\/)/i.test(v);
};

const cache = new Map();     // path -> { url, expiresAt }
const pending = new Map();   // path -> Set<resolve callback>
let flushTimer = null;

const readCache = (path) => {
  const hit = cache.get(path);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(path);
    return null;
  }
  return hit.url;
};

const writeCache = (path, url) => {
  cache.set(path, { url, expiresAt: Date.now() + CACHE_TTL_MS });
};

/** Buang cache (dipakai saat logout / ganti akun). */
export const clearImageCache = () => {
  cache.clear();
  pending.clear();
};

const settle = (path, waiters, url) => {
  const callbacks = waiters.get(path);
  if (!callbacks) return;
  callbacks.forEach((cb) => cb(url));
};

// ------------------------------------------------------------------------------
// 2. RESOLUSI SIGNED URL (BATCHING)
// ------------------------------------------------------------------------------
// Semua permintaan yang datang dalam rentang ±25 ms dikumpulkan menjadi SATU
// panggilan createSignedUrls(). Jadi menampilkan 30 unit di katalog = 1 request,
// bukan 30 request.

const flushQueue = async () => {
  flushTimer = null;
  if (pending.size === 0) return;

  const waiters = new Map(pending);
  const paths = [...waiters.keys()];
  pending.clear();

  if (!supabase) {
    paths.forEach((p) => settle(p, waiters, null));
    return;
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

    if (error) throw error;

    const byPath = new Map((data || []).map((d) => [d.path, d.signedUrl]));
    paths.forEach((p) => {
      const url = byPath.get(p);
      if (url) {
        writeCache(p, url);
        settle(p, waiters, url);
      } else {
        settle(p, waiters, null);
      }
    });
  } catch (err) {
    // Fallback: minta satu per satu supaya satu path bermasalah tidak
    // menggagalkan seluruh galeri.
    console.warn('[imageStorage] createSignedUrls gagal, mencoba per berkas:', err);
    await Promise.all(paths.map(async (p) => {
      try {
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(p, SIGNED_URL_TTL_SECONDS);
        if (error) throw error;
        writeCache(p, data.signedUrl);
        settle(p, waiters, data.signedUrl);
      } catch (e) {
        console.warn(`[imageStorage] Gagal membuat signed URL untuk "${p}":`, e?.message || e);
        settle(p, waiters, null);
      }
    }));
  }
};

/**
 * Ubah path storage menjadi Signed URL siap pakai di <img src>.
 * Nilai non-path (URL web, base64, kosong) dikembalikan apa adanya.
 * Hasil di-cache 45 menit, jadi pemanggilan berulang tidak menambah request.
 */
export const resolveImageUrl = (pathOrUrl) => new Promise((resolve) => {
  if (!pathOrUrl) return resolve('');
  if (!isStoragePath(pathOrUrl)) return resolve(pathOrUrl);

  const cached = readCache(pathOrUrl);
  if (cached) return resolve(cached);

  if (!pending.has(pathOrUrl)) pending.set(pathOrUrl, new Set());
  pending.get(pathOrUrl).add(resolve);

  if (!flushTimer) flushTimer = setTimeout(flushQueue, 25);
});

/** Versi massal untuk kebutuhan non-React (mis. ekspor/laporan). */
export const resolveImageUrls = (list = []) =>
  Promise.all((Array.isArray(list) ? list : []).map(resolveImageUrl));

// ------------------------------------------------------------------------------
// 3. UNGGAH (KOMPRES -> STORAGE -> PATH)
// ------------------------------------------------------------------------------

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

/** Konversi data URI base64 -> Blob (untuk foto lama / preview modal). */
export const dataUrlToBlob = (dataUrl) => {
  const [meta, payload] = String(dataUrl).split(',');
  const mime = (/data:([^;]+)/.exec(meta || '') || [])[1] || 'image/jpeg';
  const binary = atob(payload || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

/**
 * Kecilkan gambar di sisi browser sebelum diunggah (sisi terpanjang 1200px,
 * JPEG q0.82 -> biasanya 100-200 KB). Kalau gagal, kembalikan berkas asli.
 */
export const compressImageBlob = async (blob, { maxDim = COMPRESS_MAX_DIM, quality = COMPRESS_QUALITY } = {}) => {
  if (typeof document === 'undefined' || !blob) return blob;

  try {
    const objectUrl = URL.createObjectURL(blob);
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = objectUrl;
    });

    let { width, height } = img;
    const longest = Math.max(width, height);
    if (longest > maxDim) {
      const scale = maxDim / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(objectUrl);

    const compressed = await new Promise((resolve) => {
      if (typeof canvas.toBlob !== 'function') return resolve(null);
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });

    return compressed || blob;
  } catch (err) {
    console.warn('[imageStorage] Kompresi dilewati (unggah berkas asli):', err);
    return blob;
  }
};

/**
 * Unggah foto unit ke bucket private dan kembalikan PATH-nya
 * (bukan base64!) untuk disimpan ke kolom units.images.
 */
export const uploadUnitPhoto = async (blobOrFile, subfolder = 'units') => {
  if (!supabase) {
    throw new Error('Supabase tidak tersedia — foto tidak dapat diunggah ke storage.');
  }
  if (!blobOrFile) throw new Error('Tidak ada berkas foto untuk diunggah.');

  const mime = blobOrFile.type || 'image/jpeg';
  const ext = EXT_BY_MIME[mime] || 'jpg';
  const file = new File(
    [blobOrFile],
    `foto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`,
    { type: mime }
  );

  const path = await uploadImageToStorage(file, subfolder);
  cache.delete(path);
  return path;
};

/** Hapus objek foto dari storage (dipanggil saat foto unit dihapus). */
export const removeUnitPhoto = async (path) => {
  if (!supabase || !isStoragePath(path)) return false;
  try {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    if (error) throw error;
    cache.delete(path);
    return true;
  } catch (err) {
    // Tidak fatal: baris database tetap dihapus, hanya sisa berkas di storage.
    console.warn(`[imageStorage] Gagal menghapus berkas storage "${path}":`, err?.message || err);
    return false;
  }
};
