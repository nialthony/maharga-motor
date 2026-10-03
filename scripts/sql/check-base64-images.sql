-- ==============================================================================
-- VERIFIKASI P0-1 (READ-ONLY): sudahkah foto unit pindah dari base64 ke Storage?
-- Maharga Motor — tempel ke Supabase SQL Editor.
-- Jalankan SEBELUM dan SESUDAH menjalankan:
--     node scripts/migrate-images-to-storage.js <SERVICE_ROLE_KEY>
-- ==============================================================================

-- 1. RINGKASAN: berapa unit yang masih menyimpan base64 di kolom images?
--    Target setelah migrasi: unit_dengan_base64 = 0
SELECT
    COUNT(*)                                                          AS total_unit,
    COUNT(*) FILTER (WHERE images::text LIKE '%data:image%')          AS unit_dengan_base64,
    COUNT(*) FILTER (WHERE images::text LIKE '%http%')                AS unit_dengan_url_web,
    COUNT(*) FILTER (WHERE images::text LIKE '%["units/%')            AS unit_dengan_path_storage
FROM public.units;

-- 2. UKURAN DATA: seberapa besar kolom images menyumbang ke database?
--    (angka besar di "ukuran_images" = masih ada base64 yang perlu dimigrasi)
SELECT
    pg_size_pretty(SUM(pg_column_size(images))::bigint)               AS ukuran_kolom_images,
    pg_size_pretty(SUM(pg_column_size(images)) FILTER (WHERE images::text LIKE '%data:image%')::bigint) AS ukuran_yang_masih_base64,
    pg_size_pretty(SUM(pg_column_size(images)) FILTER (WHERE images::text LIKE '%["units/%')::bigint)  AS ukuran_path_storage,
    pg_size_pretty(pg_database_size(current_database()))              AS total_database
FROM public.units;

-- 3. UKURAN PER UNIT (10 terbesar) — unit mana yang paling membebani database?
SELECT
    id, plate, brand, model,
    jsonb_array_length(images)                                        AS jumlah_foto,
    pg_size_pretty(pg_column_size(images)::bigint)                    AS ukuran_kolom_images
FROM public.units
ORDER BY pg_column_size(images) DESC
LIMIT 10;

-- 4. DAFTAR UNIT YANG MASIH PERLU DIMIGRASI (dipakai skrip migrasi)
SELECT id, plate, brand, model, pg_size_pretty(pg_column_size(images)::bigint) AS ukuran
FROM public.units
WHERE images::text LIKE '%data:image%'
ORDER BY id;

-- 5. BUCKET STORAGE: pastikan 'showroom-assets' ada, PRIVATE, dan limit 5 MB
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'showroom-assets';

-- 6. JUMLAH BERKAS DI STORAGE + total ukurannya
SELECT
    COUNT(*)                                                          AS jumlah_berkas,
    pg_size_pretty(COALESCE(SUM((metadata->>'size')::bigint), 0))     AS total_ukuran
FROM storage.objects
WHERE bucket_id = 'showroom-assets';

-- 7. FOTO YATIM (orphan): berkas di storage yang tidak lagi dirujuk unit mana pun.
--    Muncul karena foto lama dihapus dari database sebelum P0-1 (tidak ada pembersihan).
--    Aman dihapus manual bila sudah dipastikan tidak dipakai.
SELECT o.name AS path_storage, pg_size_pretty((o.metadata->>'size')::bigint) AS ukuran
FROM storage.objects o
WHERE o.bucket_id = 'showroom-assets'
  AND NOT EXISTS (
      SELECT 1 FROM public.units u
      WHERE u.images::text LIKE '%' || o.name || '%'
  )
ORDER BY (o.metadata->>'size')::bigint DESC NULLS LAST
LIMIT 50;
