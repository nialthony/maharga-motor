-- ==============================================================================
-- MIGRATION 0002: DROP PIN COLUMN & SETUP SERVER-SIDE 2ND FACTOR PIN TABLE
-- Maharga Motor Showroom Management System
-- Database: Supabase PostgreSQL (Production Remediation)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HAPUS KOLOM PIN DARI TABEL EMPLOYEES
-- Mengeliminasi celah pembocoran PIN plaintext melalui REST API
-- ------------------------------------------------------------------------------
ALTER TABLE public.employees DROP COLUMN IF EXISTS pin;

-- ------------------------------------------------------------------------------
-- 2. TABEL FAKTOR KEDUA PIN (HASHED SERVER-SIDE DENGAN RATE LIMITING)
-- Menyimpan hash PIN (bcrypt) per user auth.users, bukan di client
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_pin_factors (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pin_hash TEXT NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security & FORCE RLS
ALTER TABLE public.employee_pin_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_pin_factors FORCE ROW LEVEL SECURITY;

-- Cabut seluruh hak akses anon
REVOKE ALL ON TABLE public.employee_pin_factors FROM anon;

-- Policy: Hanya owner showroom yang dapat mengelola tabel ini secara langsung
-- Verifikasi PIN user biasa dieksekusi via Edge Function (Deno) dengan rate limit
CREATE POLICY "pin_factors_owner_manage"
ON public.employee_pin_factors
FOR ALL
TO authenticated
USING (public.auth_role() = 'owner')
WITH CHECK (public.auth_role() = 'owner');

-- ------------------------------------------------------------------------------
-- 3. VERIFIKASI POST-MIGRATION
-- ------------------------------------------------------------------------------
-- Pastikan kolom pin sudah benar-benar terhapus dari tabel employees
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'employees' 
  AND column_name = 'pin';
-- Hasil yang diharapkan: 0 baris (kosong)
