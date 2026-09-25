-- ==============================================================================
-- MIGRATION 0003: PRIVATE SUPABASE STORAGE & COLUMN IMAGES TO JSONB
-- Maharga Motor Showroom Management System
-- Database: Supabase PostgreSQL & Storage Schema
-- Target Bucket: showroom-assets (Private - Signed URLs only)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PEMBUATAN BUCKET STORAGE PRIVATE: showroom-assets
-- Mengamankan file foto unit & aset showroom agar tidak bisa diakses publik tanpa signed URL
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'showroom-assets',
    'showroom-assets',
    false, -- Wajib FALSE (Private bucket, akses hanya via signed URL bertanda tangan)
    5242880, -- Maksimal 5MB per berkas foto
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ------------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) POLICIES UNTUK STORAGE OBJECTS
-- Catatan: storage.objects sudah memiliki RLS aktif secara default di Supabase.
-- Dilarang menjalankan ALTER TABLE / REVOKE pada storage.objects karena tabel
-- tersebut dimiliki oleh peran sistem supabase_storage_admin (Error 42501).
-- Kontrol akses sepenuhnya diatur melalui Storage Policies di bawah ini:
-- ------------------------------------------------------------------------------

-- Policy 1: Authenticated pengguna dapat membaca berkas melalui signed URL
DROP POLICY IF EXISTS "Authenticated users can read showroom assets" ON storage.objects;
CREATE POLICY "Authenticated users can read showroom assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'showroom-assets');

-- Policy 2: Authenticated pengguna dapat mengunggah foto baru
DROP POLICY IF EXISTS "Authenticated users can upload showroom assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload showroom assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'showroom-assets');

-- Policy 3: Authenticated pengguna dapat memperbarui foto unit yang diunggah
DROP POLICY IF EXISTS "Authenticated users can update showroom assets" ON storage.objects;
CREATE POLICY "Authenticated users can update showroom assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'showroom-assets')
WITH CHECK (bucket_id = 'showroom-assets');

-- Policy 4: Hanya Owner & Admin yang dapat menghapus foto dari storage
DROP POLICY IF EXISTS "Admin users can delete showroom assets" ON storage.objects;
CREATE POLICY "Admin users can delete showroom assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'showroom-assets' 
    AND public.is_admin()
);

-- ------------------------------------------------------------------------------
-- 3. MIGRASI STRUKTUR KOLOM units.images DARI TEXT[] MENJADI JSONB (IDEMPOTENT)
-- Menyimpan array path Storage (misal: ["units/17272619_foto1.jpg"])
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    -- Periksa apakah kolom images masih bertipe non-jsonb (misal: text[] atau varchar)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'units' 
          AND column_name = 'images' 
          AND data_type <> 'jsonb'
    ) THEN
        -- Buat kolom sementara jsonb
        ALTER TABLE public.units ADD COLUMN IF NOT EXISTS images_jsonb JSONB DEFAULT '[]'::jsonb;

        -- Migrasi data text[] lama ke jsonb
        UPDATE public.units 
        SET images_jsonb = to_jsonb(images) 
        WHERE images IS NOT NULL;

        -- Drop kolom lama dan rename
        ALTER TABLE public.units DROP COLUMN IF EXISTS images;
        ALTER TABLE public.units RENAME COLUMN images_jsonb TO images;

    ELSIF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'units' 
          AND column_name = 'images'
    ) THEN
        -- Jika kolom belum ada sama sekali, buat langsung sebagai JSONB
        ALTER TABLE public.units ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. VERIFIKASI POST-MIGRATION
-- ------------------------------------------------------------------------------
-- 1. Periksa status bucket showroom-assets (Harus public = false)
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'showroom-assets';
-- Hasil yang diharapkan:
-- showroom-assets | showroom-assets | f | 5242880

-- 2. Periksa tipe data kolom units.images (Harus data_type = 'jsonb')
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'units' 
  AND column_name = 'images';
-- Hasil yang diharapkan:
-- units | images | jsonb
