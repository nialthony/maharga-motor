-- ==============================================================================
-- DIAGNOSTIK (READ-ONLY): MENGAPA UNIT TIDAK TERSIMPAN KE DATABASE?
-- Maharga Motor — tempel seluruh isi file ini ke Supabase SQL Editor.
-- Tidak mengubah apa pun; hanya membaca struktur & data.
-- ==============================================================================

-- 1. CHECK constraint yang SAAT INI aktif di tabel units
--    Bandingkan dengan nilai status yang dikirim UI:
--    'Tersedia', 'Perbaikan', 'Belum Tersedia', 'Titip DP / Tempo', 'Terjual'
SELECT
    conname                    AS nama_constraint,
    pg_get_constraintdef(oid)  AS definisi
FROM pg_constraint
WHERE conrelid = 'public.units'::regclass
  AND contype = 'c'
ORDER BY conname;

-- 2. Apakah 'Perbaikan' / 'Belum Tersedia' / 'Mati Pajak' sudah diizinkan?
--    Hasil yang diharapkan SETELAH migrasi 0008: semuanya true.
SELECT
    'status Perbaikan'      AS cek, pg_get_constraintdef(oid) ILIKE '%Perbaikan%'      AS diizinkan FROM pg_constraint WHERE conname = 'units_status_check'
UNION ALL SELECT
    'status Belum Tersedia',        pg_get_constraintdef(oid) ILIKE '%Belum Tersedia%' FROM pg_constraint WHERE conname = 'units_status_check'
UNION ALL SELECT
    'tax_status Mati Pajak',        pg_get_constraintdef(oid) ILIKE '%Mati Pajak%'     FROM pg_constraint WHERE conname = 'units_tax_status_check';

-- 3. Distribusi status yang benar-benar ada di database
SELECT status, tax_status, COUNT(*) AS jumlah
FROM public.units
GROUP BY status, tax_status
ORDER BY status, tax_status;

-- 4. Unit terbaru yang benar-benar tersimpan (10 terakhir)
--    Kalau unit yang baru diinput TIDAK muncul di sini, berarti INSERT-nya ditolak.
SELECT id, plate, brand, model, status, tax_status, created_at, entry_date
FROM public.units
ORDER BY created_at DESC NULLS LAST, id DESC
LIMIT 10;

-- 5. Cek urutan BIGSERIAL vs ID dari klien (ID aplikasi = Date.now()*1000+...,
--    jauh lebih besar dari sequence => sequence harus di-setval, lihat migrasi 0008 langkah 4)
SELECT
    (SELECT MAX(id) FROM public.units)                                  AS max_id_units,
    (SELECT last_value FROM units_id_seq)                               AS sequence_units,
    (SELECT MAX(id) FROM public.repairs)                                AS max_id_repairs,
    (SELECT last_value FROM repairs_id_seq)                             AS sequence_repairs;

-- 6. Apakah RLS aktif dan policy-nya sesuai? (insert unit untuk staf terautentikasi)
SELECT schemaname, tablename, policyname, cmd, roles::text, qual, with_check
FROM pg_policies
WHERE tablename IN ('units', 'repairs', 'sales_transactions')
ORDER BY tablename, cmd;

-- 7. Trigger validasi finansial (menolak harga jual < harga beli)
--    Jika trigger ini ada, unit dengan display_price < buy_price akan GAGAL dibuat.
SELECT tgname, pg_get_triggerdef(t.tgid) AS definisi
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'units' AND NOT t.tgisinternal;
