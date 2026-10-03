# Perawatan Produksi — Maharga Motor

Dokumen ini menjelaskan **cara menjaga aplikasi tetap hidup dan data tetap aman** setelah diserahkan ke pembeli.
Konteks risiko lengkapnya ada di `ANALISIS-KETAHANAN-PRODUKSI.md`.

---

## 1. Status dua pengaman utama

| Pengaman | Berkas | Status | Kebutuhan |
|---|---|---|---|
| **P0-3 Anti-pause** | `.github/workflows/keep-alive.yml` | ✅ **AKTIF** | tidak ada — secret sudah terpasang |
| **P0-2 Backup harian** | `.github/workflows/backup-supabase.yml` | ⚠️ **menunggu 1 secret** | `SUPABASE_DB_URL` |

### P0-3 — Keep-Alive (sudah jalan)

Supabase Free **mem-pause project yang idle 7 hari**. Kalau showroom libur seminggu, aplikasi mati sampai
di-restore manual. Workflow ini ping `/auth/v1/health` setiap 2 hari (09:00 WIB) — jauh di bawah ambang 7 hari.

- Ping manual: tab **Actions → Supabase Keep-Alive → Run workflow**
- Kalau nanti pakai Supabase Pro, project tidak pernah pause → workflow ini boleh dihapus

### P0-2 — Backup harian (perlu isi 1 secret, ±2 menit)

Supabase Free **tidak punya backup otomatis dan tidak punya PITR**. Isi data finansial showroom, jadi ini
risiko paling mahal.

**Langkah:**
1. Supabase Dashboard → **Settings → Database → Connection string → URI**
2. Pilih **Session pooler** — host berakhiran `.pooler.supabase.com`, **port 5432**
   ⚠️ **Jangan** pakai Transaction pooler (port 6543): mode itu tidak mendukung `pg_dump` dan akan gagal
3. Ganti `[YOUR-PASSWORD]` dengan password database. Kalau password mengandung karakter khusus
   (`@ : / ? # [ ] %`), URL-encode dulu — contoh `@` menjadi `%40`
4. Repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Nama: `SUPABASE_DB_URL`
   - Nilai: connection string di atas
5. Uji: **Actions → Backup Supabase (harian) → Run workflow**

> Sebelum secret diisi, workflow ini **sengaja gagal** (bukan diam-diam hijau) supaya tidak ada kesan
> "backup aman" padahal belum ada sama sekali. Kalau ingin mematikan sementaranya:
> **Actions → Backup Supabase (harian) → ⋯ → Disable workflow**.

**🔴 Uji restore sekali (wajib).** Backup yang belum pernah diuji restore bukan backup, hanya harapan:

```bash
# 1) Unduh artifact dari tab Actions (maharga_backup_XXXX.dump)
# 2) Buat project Supabase kedua (gratis) sebagai tujuan uji
# 3) Restore
pg_restore --no-owner --no-privileges -d "<URL_PROJECT_BARU>" maharga_backup_XXXX.dump

# 4) Periksa isinya
#    SELECT COUNT(*) FROM units;
#    SELECT COUNT(*) FROM sales_transactions;
#    SELECT COUNT(*) FROM employees;
```

---

## 2. ⚠️ Batas 60 hari GitHub (penting untuk jangka panjang)

GitHub **menonaktifkan workflow terjadwal setelah repo tidak ada commit selama 60 hari**. Kalau aplikasi sudah
stabil dan tidak lagi diubah kodenya, dua workflow di atas akan berhenti sendiri — dan **P0-3 ikut mati,
sehingga project Supabase bisa ter-pause kembali**.

Tiga cara menanganinya (pilih satu):

| Cara | Usaha | Keandalan |
|---|---|---|
| **A. UptimeRobot (gratis)** ⭐ | daftar, isi URL `https://<project>.supabase.co/auth/v1/health` + header `apikey`, monitor tiap 5 menit | **paling andal** — eksternal, tidak bergantung aktivitas repo, sekaligus memberi peringatan email kalau down |
| B. Aktifkan ulang manual | buka tab Actions → **Enable workflow** (GitHub mengirim email sebelum menonaktifkan) | sedang — bergantung pada seseorang yang membaca email |
| C. Supabase Pro ($25/bln) | tidak perlu keep-alive & tidak perlu backup GitHub (ada backup harian 7 hari + no-pause) | **paling tinggi** — paling cocok untuk aplikasi yang benar-benar dijual |

> Catatan: Supabase mengirim peringatan email sebelum project di-pause, jadi opsi B masih ada jaring pengaman.
> Tapi untuk aplikasi yang dibayar pembeli, opsi A atau C jauh lebih tenang.

---

## 3. Pengingat berkala

| Kapan | Yang diperiksa |
|---|---|
| Mingguan | Tab Actions: apakah *Backup* & *Keep-Alive* hijau? |
| Bulanan | Supabase Dashboard → **Reports/Usage**: ukuran database, egress, storage (batas Free: 500 MB / 5 GB / 1 GB) |
| Per kuartal | Unduh satu artifact backup & coba buka isinya (`pg_restore --list`) untuk memastikan dump masih sehat |
| Sebelum serah terima | Pindahkan kepemilikan akun Supabase + Cloudflare ke pembeli; lihat checklist di `ANALISIS-KETAHANAN-PRODUKSI.md` bagian 6 |

---

## 4. Kalau terkait foto & kuota

Foto unit seharusnya **tidak** lagi disimpan di database (P0-1). Cek kondisi kapan saja:

```sql
-- tempel di Supabase SQL Editor
SELECT COUNT(*) FILTER (WHERE images::text LIKE '%data:image%') AS masih_base64,
       pg_size_pretty(SUM(pg_column_size(images))::bigint)      AS ukuran_kolom_images
FROM public.units;
```

`masih_base64` harus **0**. Kalau tidak, jalankan `node scripts/migrate-images-to-storage.js <SECRET_KEY> --dry-run`
lalu tanpa `--dry-run`. Rincian: `P0-1-FOTO-KE-STORAGE.md`.
