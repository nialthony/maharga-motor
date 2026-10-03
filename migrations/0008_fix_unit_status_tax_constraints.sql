-- ==============================================================================
-- MIGRATION 0008: SINKRONISASI CHECK CONSTRAINT units.status & units.tax_status
-- Maharga Motor Showroom Management System
-- Database: Supabase PostgreSQL
-- ==============================================================================
-- MASALAH YANG DIPERBAIKI:
-- 1. UI (NewUnitModal / Inventory / WorkshopService) memakai status:
--       'Tersedia', 'Perbaikan', 'Belum Tersedia', 'Titip DP / Tempo', 'Terjual'
--    tetapi CHECK constraint di database hanya mengizinkan:
--       'Tersedia', 'Titip DP / Tempo', 'Terjual'
--    => INSERT/UPDATE unit dengan status 'Perbaikan' atau 'Belum Tersedia'
--       GAGAL dengan error 23514 (check_violation) dan unit tidak tersimpan.
--    => Alur "Unit Masuk > Bengkel > Tersedia" (commit 908aaf1) ikut gagal diam-diam.
--
-- 2. UI dropdown pajak mengirim 'Mati', sedangkan constraint hanya mengizinkan
--    'Hidup' / 'Mati Pajak'
--    => Semua unit dengan "Pajak Mati" GAGAL tersimpan.
--
-- 3. ID unit dibuat di sisi klien (Date.now()) sehingga sequence BIGSERIAL
--    tidak pernah naik => resiko tabrakan primary key di masa depan.
--
-- Jalankan file ini SEKALI di Supabase SQL Editor (aman diulang / idempotent).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. NORMALISASI DATA LAMA YANG TIDAK VALID (supaya ADD CONSTRAINT tidak gagal)
-- ------------------------------------------------------------------------------

-- 1a. Status unit -> pakai ejaan resmi UI
UPDATE public.units
SET status = CASE
    WHEN status ILIKE '%bengkel%'  OR status ILIKE '%perbaikan%' THEN 'Perbaikan'
    WHEN status ILIKE '%belum%'                                   THEN 'Belum Tersedia'
    WHEN status ILIKE '%titip%'    OR status ILIKE '%tempo%'      THEN 'Titip DP / Tempo'
    WHEN status ILIKE '%terjual%'  OR status ILIKE '%sold%'       THEN 'Terjual'
    WHEN status ILIKE '%ready%'    OR status ILIKE '%tersedia%'   THEN 'Tersedia'
    ELSE 'Tersedia'
END
WHERE status IS NULL
   OR status NOT IN ('Tersedia', 'Perbaikan', 'Belum Tersedia', 'Titip DP / Tempo', 'Terjual');

-- 1b. Status pajak -> kanonik 'Mati Pajak'
UPDATE public.units
SET tax_status = 'Mati Pajak'
WHERE tax_status IN ('Mati', 'Pajak Mati', 'mati', 'pajak mati');

UPDATE public.units
SET tax_status = 'Hidup'
WHERE tax_status IS NULL
   OR tax_status NOT IN ('Hidup', 'Mati Pajak', 'Mati');

-- ------------------------------------------------------------------------------
-- 2. GANTI CHECK CONSTRAINT units.status DENGAN DAFTAR LENGKAP
--    (DROP dulu constraint apa pun yang menyentuh kolom `status`,
--     bukan `tax_status`, agar tidak bentrok dengan penamaan lama)
-- ------------------------------------------------------------------------------
DO $$
DECLARE c record;
BEGIN
    FOR c IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.units'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ~ '\mstatus\M'   -- word-boundary: tidak match tax_status
    LOOP
        EXECUTE format('ALTER TABLE public.units DROP CONSTRAINT IF EXISTS %I', c.conname);
        RAISE NOTICE 'Constraint status lama dihapus: %', c.conname;
    END LOOP;
END $$;

ALTER TABLE public.units
    ADD CONSTRAINT units_status_check
    CHECK (status IN ('Tersedia', 'Perbaikan', 'Belum Tersedia', 'Titip DP / Tempo', 'Terjual'));

-- ------------------------------------------------------------------------------
-- 3. GANTI CHECK CONSTRAINT units.tax_status ('Mati' lama tetap ditoleransi
--    selama transisi cache PWA, tetapi UI baru mengirim 'Mati Pajak')
-- ------------------------------------------------------------------------------
DO $$
DECLARE c record;
BEGIN
    FOR c IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.units'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ~ '\mtax_status\M'
    LOOP
        EXECUTE format('ALTER TABLE public.units DROP CONSTRAINT IF EXISTS %I', c.conname);
        RAISE NOTICE 'Constraint tax_status lama dihapus: %', c.conname;
    END LOOP;
END $$;

ALTER TABLE public.units
    ADD CONSTRAINT units_tax_status_check
    CHECK (tax_status IN ('Hidup', 'Mati Pajak', 'Mati'));

-- ------------------------------------------------------------------------------
-- 4. SINKRONISASI SEQUENCE BIGSERIAL
--    Karena ID unit dikirim dari sisi klien (Date.now()), sequence tertinggal
--    jauh di belakang MAX(id). Tanpa ini, INSERT tanpa ID eksplisit akan
--    menabrak primary key.
-- ------------------------------------------------------------------------------
SELECT setval(
    pg_get_serial_sequence('public.units', 'id'),
    GREATEST(COALESCE((SELECT MAX(id) FROM public.units), 1), 1)
);

SELECT setval(
    pg_get_serial_sequence('public.repairs', 'id'),
    GREATEST(COALESCE((SELECT MAX(id) FROM public.repairs), 1), 1)
);

SELECT setval(
    pg_get_serial_sequence('public.employees', 'id'),
    GREATEST(COALESCE((SELECT MAX(id) FROM public.employees), 1), 1)
);

-- ------------------------------------------------------------------------------
-- 5. SEGARKAN CACHE SKEMA PostgREST (Supabase API)
--    Tanpa ini, error 23514 bisa masih muncul beberapa menit setelah migrasi.
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- 6. VERIFIKASI (jalankan manual untuk memastikan hasilnya)
-- ==============================================================================
-- 6.1 Definisi constraint yang sekarang aktif:
--     Harus muncul 'Perbaikan' & 'Belum Tersedia' di units_status_check,
--     dan 'Mati Pajak' di units_tax_status_check.
SELECT conname, pg_get_constraintdef(oid) AS definisi
FROM pg_constraint
WHERE conrelid = 'public.units'::regclass
  AND contype = 'c'
ORDER BY conname;

-- 6.2 Uji tuntas 5 status resmi (harus semuanya SUKSES, lalu dihapus lagi):
--     Jalankan satu per satu; semua harus lolos tanpa error 23514.
-- INSERT INTO public.units (brand, model, year, plate, status, tax_status, display_price)
-- VALUES ('Test','Migrasi 0008', 2020, 'AD 1 TEST', 'Perbaikan',      'Mati Pajak', 1000000);
-- UPDATE public.units SET status = 'Belum Tersedia' WHERE plate = 'AD 1 TEST';
-- UPDATE public.units SET status = 'Tersedia'        WHERE plate = 'AD 1 TEST';
-- UPDATE public.units SET status = 'Titip DP / Tempo' WHERE plate = 'AD 1 TEST';
-- UPDATE public.units SET status = 'Terjual'         WHERE plate = 'AD 1 TEST';
-- DELETE FROM public.units WHERE plate = 'AD 1 TEST';

-- 6.3 Cek distribusi status stok saat ini:
SELECT status, tax_status, COUNT(*) AS jumlah
FROM public.units
GROUP BY status, tax_status
ORDER BY status, tax_status;
