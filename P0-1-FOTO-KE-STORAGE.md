# P0-1 — Foto Unit Dipindah dari Base64 ke Supabase Storage

**Status:** kode selesai & teruji · **migrasi data lama belum dijalankan** (langkah 2 di bawah, butuh Service Role Key)
**Alasan:** foto base64 di kolom `units.images` membuat kuota Supabase (500 MB database / 5 GB egress) habis dalam hitungan minggu, dan `localStorage` browser penuh setelah belasan unit. Rincian hitungan ada di `ANALISIS-KETAHANAN-PRODUKSI.md`.

---

## 1. Apa yang berubah di kode

### Alur baru

```
UNGGAH : File/Blob ──kompres(1200px, q0.82)──> bucket 'showroom-assets' ──> simpan PATH ke units.images
TAMPIL : path ──cek cache──> createSignedUrls (BATCH) ──> <UnitImage src="signed-url">
NILAI LAMA: URL web / base64 sisa migrasi DILEWATKAN apa adanya (tetap tampil tanpa migrasi)
```

### File baru

| File | Fungsi |
|---|---|
| `src/lib/imageStorage.js` | Resolusi path → Signed URL dengan **cache 45 menit** + **batching**: menampilkan 30 unit = **1 request**, bukan 30. Ada jalur cadangan per-berkas bila batch gagal. Juga: `compressImageBlob()`, `dataUrlToBlob()`, `uploadUnitPhoto()`, `removeUnitPhoto()` |
| `src/components/ui/UnitImage.jsx` | Komponen pengganti `<img>` untuk foto unit. Menukar path menjadi Signed URL, menampilkan placeholder transparan selama menunggu (layout tidak bergeser), `loading="lazy"` |
| `test/imageStorage.test.mjs` + `test/supabase-stub.mjs` + `test/register-loader.mjs` | 27 pemeriksaan otomatis tanpa browser/network: deteksi path, batching, cache, passthrough, unggah, hapus, dan jalur cadangan |
| `scripts/sql/check-base64-images.sql` | SQL verifikasi (read-only): berapa unit masih base64, ukuran kolom `images`, foto yatim (orphan) di storage |

### File yang diubah

| File | Perubahan |
|---|---|
| `src/components/NewUnitModal.jsx` | Berkas foto disimpan sebagai `File` (bukan hanya base64) → dikompres + diunggah saat submit; yang masuk database adalah **path**. Batas berkas 800 KB → **5 MB** (batas bucket; dikompres dulu jadi ±150 KB). Preview form tetap pakai base64 lokal (tidak pernah dikirim ke DB). State `imageUrl` yang sudah mati dihapus |
| `src/components/AdminPanel.jsx` | `handleApplyPhoto()` mengunggah base64 → storage lalu menyimpan path; `handleDeletePhoto()` ikut **menghapus objek di storage** agar tidak menumpuk foto yatim |
| `Inventory.jsx`, `UnitDetailModal.jsx`, `SalesPOS.jsx` (2 titik), `WorkshopService.jsx` (2 titik), `AdminPanel.jsx` (3 titik) | 9 titik render `<img>` → `<UnitImage>` |
| `scripts/migrate-images-to-storage.js` | Ditambah mode **`--dry-run`** (melihat rencana tanpa mengubah apa pun) |
| `package.json` | `npm run test:images`, `npm run migrate:images`, `npm run migrate:images:dry` |

---

## 2. Migrasi data lama — STATUS: TIDAK DIPERLUKAN SAAT INI

Pemeriksaan langsung ke database produksi (4 Oktober 2026, dry-run read-only):

| Yang diperiksa | Hasil |
|---|---|
| Unit di tabel `units` | **1** (AD 7373 USB — Yamaha NMAX NEW, status Terjual) |
| Unit dengan foto base64 | **0** |
| Foto di bucket `showroom-assets` | **0 objek** |
| Transaksi / karyawan / catatan servis | 1 / 5 / 1 |

**Artinya: tidak ada foto base64 yang perlu dipindahkan.** Unit dengan foto base64 tidak pernah
tersimpan ke database karena bug "hilang setelah refresh" (lihat `PERBAIKAN-BUG-UNIT-TIDAK-TERSIMPAN.md`) —
jadi risiko egress besar yang dihitung di `ANALISIS-KETAHANAN-PRODUKSI.md` belum sempat terwujud.

Perbaikan P0-1 tetap penting untuk **ke depan**: mulai sekarang setiap foto baru yang diunggah
langsung masuk ke Storage dan hanya path-nya yang disimpan ke database.

Jalankan ulang pemeriksaan ini kapan pun (mis. setelah data showroom terisi penuh) dengan langkah 2a–2b di bawah —
kalau `unit_dengan_base64` masih 0, tidak ada yang perlu dimigrasi.

### Kalau nanti ternyata ada foto base64 (mis. setelah impor data lama)

Skripnya sudah ada, sudah diuji terhadap API produksi, dan mendukung `--dry-run` + uji satu unit.

### 2a. Lihat dulu keadaan sekarang

Tempel isi `scripts/sql/check-base64-images.sql` ke Supabase SQL Editor. Catat angka **`unit_dengan_base64`** dan **`ukuran_kolom_images`**.

### 2b. Pratinjau migrasi (tidak mengubah apa pun)

```bash
# Ambil Service Role Key: Supabase Dashboard -> Settings -> API -> service_role (RAHASIA!)
npm run migrate:images:dry -- <SERVICE_ROLE_KEY>
```

Periksa keluarannya: berapa unit & berapa foto yang akan dipindah, dan total KB-nya.

> ⚠️ **Pastikan backup harian sudah pernah sukses** (`ops/backup-supabase.yml`) sebelum langkah berikutnya. Ini mengubah ratusan baris sekaligus.
> Service Role Key bersifat rahasia (melewati semua RLS). Jangan disimpan di file, jangan di-commit; setelah selesai ia tidak diperlukan lagi oleh aplikasi.

### 2c. Jalankan migrasi sungguhan

```bash
npm run migrate:images -- <SERVICE_ROLE_KEY>
```

### 2d. Verifikasi hasil

```sql
-- Jalankan lagi scripts/sql/check-base64-images.sql
-- Target: unit_dengan_base64 = 0 dan ukuran_kolom_images turun drastis
SELECT
    COUNT(*) FILTER (WHERE images::text LIKE '%data:image%') AS masih_base64,
    pg_size_pretty(SUM(pg_column_size(images))::bigint)      AS ukuran_kolom_images
FROM public.units;
```

Uji aplikasi: buka Katalog → foto harus tetap tampil; tambah unit baru dengan foto dari HP → simpan → refresh → foto tetap ada; cek di SQL bahwa `images` berisi `["units/....jpg"]`.

---

## 3. Uji otomatis & pemeriksaan rutin

```bash
npm run test:images    # 27 pemeriksaan logika foto (tanpa network)
npm run check:status   # paritas status UI <-> constraint database
npm run build
```

---

## 4. Kalau ada yang salah (rollback)

1. **Kode**: `git revert <commit>` lalu deploy ulang. Aplikasi versi lama tetap bisa membaca path storage? **Tidak** — karena itu rollback kode sebaiknya dibarengi rollback data.
2. **Data**: restore dari backup harian (`ops/backup-supabase.yml`) — karena itu langkah 2b menekankan backup dulu.
3. **Foto di storage tidak hilang** saat rollback: berkas tetap di bucket `showroom-assets`; hanya kolom `units.images` yang kembali ke base64.

---

## 5. Catatan & sisa pekerjaan

1. **Foto yatim (orphan)**: foto yang dihapus sebelum P0-1 tidak pernah dibersihkan dari storage. Query pembersihannya ada di `check-base64-images.sql` bagian 7 — periksa dulu, baru hapus manual.
2. **Belum ikut dimigrasi (masih base64 di database, skala kecil):**
   - `employees.avatar` (foto profil staf) — beberapa baris saja, ±30–60 KB/baris.
   - `system_settings.store_logo` (logo showroom) — 1 baris.
   Keduanya jauh lebih kecil dari foto unit, tapi tetap disarankan pindah ke storage nanti (bisa memakai `uploadUnitPhoto(blob, 'avatars')` / subfolder `branding`).
3. **`fetchCloudData()` masih `select('*')`**: sekarang aman karena kolom `images` hanya berisi path (kecil). Kalau nanti ingin lebih hemat, ganti ke daftar kolom eksplisit.
4. **Signed URL berlaku 1 jam** dan di-cache 45 menit di memori. Kalau tab dibiarkan terbuka >1 jam lalu digambar ulang dengan cache kedaluwarsa, URL akan dibuat ulang otomatis (tanpa intervensi pengguna).
5. **RLS storage** sudah benar sejak migrasi `0003` (bucket private + policy per peran), jadi tidak ada perubahan database yang diperlukan untuk P0-1.
