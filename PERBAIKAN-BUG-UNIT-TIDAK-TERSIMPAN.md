# Perbaikan: Unit Tampil di Katalog tapi Tidak Tersimpan ke Database

**Gejala yang dilaporkan**
1. Tambah unit → muncul di katalog, tetapi setelah halaman di-refresh **hilang**.
2. Tambah 5 unit berturut-turut → hanya **2** yang benar-benar masuk database.

---

## 1. Akar masalah (root cause)

### Penyebab utama: nilai `status` yang dikirim UI tidak diizinkan database

Commit terakhir (`908aaf1` — *"rapikan alur unit masuk-bengkel-tersedia"*) menambahkan dua
status baru di UI:

| Status di UI | Lokasi |
|---|---|
| `'Perbaikan'` (**default** saat modal dibuka) | `src/components/NewUnitModal.jsx` |
| `'Belum Tersedia'` | `src/components/NewUnitModal.jsx` |
| `'Perbaikan'` (tombol bengkel) | `src/components/WorkshopService.jsx` |
| `'Perbaikan'` (opsi filter) | `src/components/Inventory.jsx` |

Sedangkan **CHECK constraint di database tidak pernah diperbarui**:

```sql
-- schema.sql baris 48 (masih berlaku, tidak ada migrasi yang mengubahnya)
status VARCHAR(30) DEFAULT 'Tersedia'
  CHECK (status IN ('Tersedia', 'Titip DP / Tempo', 'Terjual'))
```

Akibatnya setiap `INSERT`/`UPDATE` unit dengan status `'Perbaikan'` atau `'Belum Tersedia'`
**ditolak PostgreSQL** dengan error `23514 (check_violation)`.

Hal yang sama terjadi pada status pajak:

| UI mengirim | Database izinkan |
|---|---|
| `'Mati'` (`NewUnitModal` dropdown) | `'Hidup'`, `'Mati Pajak'` |

→ **Semua unit dengan "Pajak Mati" juga gagal tersimpan.**

Inilah sebabnya "5 unit hanya 2 masuk": unit yang kebetulan diset **`Tersedia` + `Hidup`**
berhasil, sisanya (default `Perbaikan`, atau pajak mati) ditolak database.

### Penyebab kedua: error database tidak pernah diperiksa (silent failure)

`supabase-js` **tidak melempar exception** saat query gagal — ia mengembalikan `{ data, error }`.
Kode lama mengabaikan `error` sepenuhnya:

```js
// src/lib/cloudStore.js (sebelum perbaikan, baris 345)
export const saveNewUnitToCloud = async (newUnit) => {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from('units').upsert([unitToDb(newUnit)], { onConflict: 'id' }); // error diabaikan
  } catch (e) {
    console.warn('Gagal upload unit baru ke cloud:', e); // tidak pernah tercapai
  }
};
```

Dan pemanggilnya juga tidak menunggu hasilnya:

```js
// src/App.jsx (sebelum perbaikan, baris 375)
const handleAddUnit = (newUnit) => {
  setUnits([newUnit, ...units]);          // state lokal: unit "ada"
  saveNewUnitToCloud(newUnit, ...);       // tidak di-await, hasil diabaikan
};
```

Jadi UI selalu menampilkan "berhasil" walaupun database menolak.

### Mengapa hilang setelah refresh?

Saat halaman dimuat, `App.jsx` mengembalikan data dari `localStorage`
(`maharga_units_v3_clean`) **lalu langsung ditimpa** oleh `fetchCloudData()` yang membaca
isi database. Karena unit tersebut tidak pernah masuk database, unit itu lenyap setelah refresh.

### Penyebab ketiga (bonus, ikut diperbaiki): ID unit dari klien

`id: Date.now()` di `NewUnitModal` dipakai pada kolom `BIGSERIAL` dan disimpan dengan
`upsert(..., { onConflict: 'id' })`.

* Dua unit yang dibuat pada **milidetik yang sama** mendapat ID identik →
  upsert akan **MENIMPA** unit pertama (satu unit hilang tanpa error).
* `syncAllToCloud` mengirim seluruh array; bila ada ID duplikat, PostgreSQL menolak
  **seluruh batch** dengan error `21000` (`ON CONFLICT DO UPDATE cannot affect row a second time`).
* Sequence `units_id_seq` tidak pernah naik karena ID selalu diisi manual → `INSERT`
  berikutnya tanpa ID eksplisit akan menabrak primary key.

### Penyebab keempat: balapan dengan realtime

`subscribeToCloudRealtime()` melakukan refetch penuh lalu `setUnits(remoteData.units)`
setiap kali ada perubahan di tabel `units`. Bila pengguna menyimpan unit baru saat refetch
dari penyimpanan sebelumnya masih berjalan, snapshot lama (yang belum memuat unit baru)
menimpa state lokal → unit "tampil lalu hilang" **tanpa perlu refresh**.

---

## 2. Yang diubah

| File | Perubahan |
|---|---|
| `migrations/0008_fix_unit_status_tax_constraints.sql` | **BARU.** Menyelaraskan CHECK constraint `units.status` (kini termasuk `Perbaikan` & `Belum Tersedia`) dan `units.tax_status` (termasuk `Mati Pajak`), menormalkan data lama, menyinkronkan sequence `BIGSERIAL`, dan reload cache skema PostgREST. Idempotent. |
| `src/lib/unitStatus.js` | **BARU.** Sumber tunggal status resmi + `normalizeUnitStatus()`, `normalizeTaxStatus()`, `generateUnitId()`, `describeDbError()`. Modul murni tanpa dependensi Supabase sehingga bisa diuji. |
| `src/lib/cloudStore.js` | `saveNewUnitToCloud()` kini memakai `INSERT` (bukan upsert yang bisa menimpa), **memeriksa `error`**, retry sekali dengan ID baru saat bentrok, dan melempar pesan yang bisa dimengerti. Ditambah `updateUnitStatusInCloud()`. `syncAllToCloud()`, `saveTransactionToCloud()`, `saveSettlementToCloud()`, `deleteUnitFromCloud()` kini melaporkan kegagalan (plus dedupe ID & fallback transaksi yang mengisi kolom NOT NULL). |
| `src/App.jsx` | `handleAddUnit()` menjadi `async`, menunggu hasil simpan, **rollback state bila gagal**, dan mengirim pesan error ke modal. `handleUpdateUnitStatus()` (alur bengkel) juga rollback + memberi tahu pengguna. Perbaikan data servis/HPP memeriksa error. Refetch realtime ditahan selama penulisan berjalan (`pendingWritesRef`). Side-effect dikeluarkan dari updater `setState` di `handleUpdateEmployees()`. |
| `src/components/NewUnitModal.jsx` | Dropdown pajak mengirim `'Mati Pajak'` (bukan `'Mati'`). ID memakai `generateUnitId()`. Submit menjadi `async` dengan status "Menyimpan…", **banner error merah bila gagal** (modal tidak ditutup agar isian tidak hilang). |
| `scripts/check-unit-status-parity.mjs` | **BARU.** Penjaga regresi: membandingkan semua status yang bisa ditulis UI dengan isi CHECK constraint di migrasi 0008, plus uji normalisasi & keunikan ID. Jalankan `npm run check:status`. |
| `scripts/sql/check-units-schema-drift.sql` | **BARU.** Diagnostik read-only untuk Supabase SQL Editor. |

---

## 3. Cara menerapkan

### Langkah 1 — Jalankan migrasi database (WAJIB, ini inti perbaikannya)

Buka **Supabase Dashboard → SQL Editor → New query**, tempel **seluruh isi**
`migrations/0008_fix_unit_status_tax_constraints.sql`, lalu **Run**.

Verifikasi cepat (harus muncul `Perbaikan` dan `Belum Tersedia`):

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.units'::regclass AND contype = 'c';
```

> Tanpa langkah ini, aplikasi versi baru akan menampilkan pesan error yang jelas
> ("Status unit ditolak database… jalankan migrasi 0008") alih-alih gagal diam-diam.

### Langkah 2 — Deploy ulang aplikasi

```bash
npm install
npm run check:status   # opsional: pastikan UI & database sinkron
npm run deploy         # build + wrangler deploy
```

### Langkah 3 — Uji terima

1. Buka **Input Unit Baru**, biarkan status di **"Masuk Bengkel"** (Perbaikan) → Simpan.
2. **Refresh halaman** → unit harus **tetap ada** di katalog.
3. Ulangi 5x berturut-turut (campur status bengkel/belum tersedia/tersedia, dan pajak mati).
4. Cek di SQL Editor:

```sql
SELECT id, plate, status, tax_status, created_at
FROM public.units ORDER BY created_at DESC LIMIT 10;
```

5. Bila masih gagal, jalankan `scripts/sql/check-units-schema-drift.sql` dan kirimkan
   hasilnya — pesan error kini muncul di UI dan di console browser.

### Langkah 4 — Bereskan unit yang gagal tersimpan sebelumnya

Unit yang tidak pernah masuk database harus **diinput ulang**. Unit yang tampil di katalog
sekarang tetapi tidak ada di hasil query langkah 3.4 adalah sisa data lama di `localStorage`;
setelah refresh, katalog akan bersih mengikuti isi database.

---

## 4. Catatan tambahan (temuan, belum diubah)

1. **Foto unit disimpan sebagai base64 di kolom `units.images`.** Migrasi 0003 mengubah kolom
   ini menjadi `JSONB` dengan rencana menyimpan *path* Storage (`showroom-assets`), tetapi
   `NewUnitModal` masih mengirim data URI base64 (hingga ~800 KB → ±1 MB per baris).
   Sebaiknya unggah ke bucket `showroom-assets` lalu simpan path-nya saja.
2. **`sales_transactions` punya pola fallback** yang membuang kolom — indikasi pernah ada
   ketidakcocokan skema. Kini kegagalannya dilaporkan ke pengguna, tetapi sebaiknya
   kolom-kolom di migrasi disamakan dengan payload aktif.
3. **`unitToDb()` selalu mengirim seluruh kolom.** Bila migrasi 0002b/0003 belum dijalankan
   di project Supabase, error `PGRST204` akan muncul — sekarang pesannya sudah jelas.
4. **Anon key hardcoded** di `src/lib/supabaseClient.js` sebagai fallback. Key publishable
   memang aman dipublikasikan, tetapi lebih baik diwajibkan lewat env (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) supaya build tidak pernah "nyasar" ke project default.
5. **`npm run check` (`tsc --noEmit`) tidak bisa jalan** karena tidak ada `allowJs` /
   konfigurasi JSX di `tsconfig.json` untuk file `.jsx`. Pertimbangkan mengaktifkan
   `"checkJs": false` + `allowJs: true` atau menambahkan `// @ts-check` bertahap.
