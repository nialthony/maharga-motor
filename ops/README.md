# ops/ — Perawatan Produksi Maharga Motor

Folder ini berisi dua workflow GitHub Actions yang **belum aktif**. Keduanya menjawab risiko jangka panjang
di `ANALISIS-KETAHANAN-PRODUKSI.md`, dan **belum di-commit** — silakan review dulu.

## 1. `keep-alive.yml` — cegah Supabase Free di-pause

Supabase Free mem-pause project yang idle 7 hari. Kalau showroom libur seminggu, aplikasi mati sampai
di-restore manual. Workflow ini ping ringan setiap 2 hari.

**Pasang:** salin ke `.github/workflows/keep-alive.yml`, lalu isi 2 secret:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`. Selesai.

> Kalau nanti pakai Supabase Pro (tidak pernah pause), workflow ini boleh dihapus.

## 2. `backup-supabase.yml` — backup harian (pengganti backup Pro)

Supabase Free **tidak punya backup otomatis**. Workflow ini `pg_dump` tiap hari 01:00 WIB → disimpan sebagai
artifact GitHub 30 hari (+ opsi kirim ke Cloudflare R2 untuk retensi panjang).

**Pasang:** salin ke `.github/workflows/backup-supabase.yml`, isi secret `SUPABASE_DB_URL`
(Supabase Dashboard → Settings → Database → Connection string → URI, port 5432).

**WAJIB diuji sekali:** restore hasil dump ke project Supabase kedua (gratis):

```bash
pg_restore --no-owner --no-privileges -d "<URL_PROJECT_BARU>" maharga_backup_2026-10-04_1800.dump
```

Backup yang belum pernah diuji restore bukan backup — hanya harapan.

---

## Yang belum bisa diselesaikan oleh file di folder ini

- **Foto base64 di database** (penyebab utama risiko egress). Perbaikannya ada di kode aplikasi:
  pakai `uploadImageToStorage()` / `getStorageImageUrl()` yang sudah tersedia di `src/lib/supabaseClient.js`,
  lalu jalankan `scripts/migrate-images-to-storage.js` untuk memindahkan foto lama.
- **Pemindahan kepemilikan akun** Supabase + Cloudflare ke pembeli saat serah terima.
- **Monitoring** uptime (UptimeRobot / Better Stack) — gratis, tinggal daftar dan isi URL aplikasi.

Estimasi waktu pengerjaan semuanya: **±1 hari kerja**. Lihat checklist lengkap di
`ANALISIS-KETAHANAN-PRODUKSI.md` bagian 6.
