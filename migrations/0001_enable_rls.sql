-- ==============================================================================
-- MIGRATION 0001: ENABLE & FORCE ROW LEVEL SECURITY (RLS) & REVOKE ANON ACCESS
-- Maharga Motor Showroom Management System
-- Database: Supabase PostgreSQL (Production Remediation)
-- Target Tables: employees, units, sales_transactions, system_settings, repairs
-- ==============================================================================
--
-- PENTING / CRITICAL WARNING:
-- Setelah script migrasi ini dieksekusi di Supabase SQL Editor dan FORCE RLS aktif:
-- SEMUA user atau klien yang masih mengakses database menggunakan role 'anon' 
-- (tanpa JWT session terautentikasi) akan berhenti berfungsi (HTTP 401/403/406) 
-- sampai implementasi Supabase Auth di sisi klien selesai pada Tahap 5.
-- URUTAN RILIS: Eksekusi SQL ini terlebih dahulu, baru deploy pembaruan aplikasi klien!
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BAGIAN A: TABEL CADANGAN (AUDIT BACKUP)
-- Menyimpan snapshot data sebelum pengetatan hak akses & struktur
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public._audit_backup_employees AS SELECT * FROM public.employees;
CREATE TABLE IF NOT EXISTS public._audit_backup_units AS SELECT * FROM public.units;
CREATE TABLE IF NOT EXISTS public._audit_backup_sales_transactions AS SELECT * FROM public.sales_transactions;
CREATE TABLE IF NOT EXISTS public._audit_backup_system_settings AS SELECT * FROM public.system_settings;
CREATE TABLE IF NOT EXISTS public._audit_backup_repairs AS SELECT * FROM public.repairs;

-- Pastikan tabel audit backup ini hanya bisa dibaca oleh superuser/service_role
ALTER TABLE public._audit_backup_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._audit_backup_employees FORCE ROW LEVEL SECURITY;
ALTER TABLE public._audit_backup_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._audit_backup_units FORCE ROW LEVEL SECURITY;
ALTER TABLE public._audit_backup_sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._audit_backup_sales_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public._audit_backup_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._audit_backup_system_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public._audit_backup_repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._audit_backup_repairs FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PERSIAPAN SKEMA: Relasi auth.users ke employees
-- Menambahkan kolom user_id bertipe UUID yang merujuk ke auth.users(id)
-- ------------------------------------------------------------------------------
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);

-- ------------------------------------------------------------------------------
-- BERSIHKAN POLICY LAMA (PERMISSIVE "PUBLIC FULL ACCESS")
-- Menghapus semua policy bawaan yang membuka akses publik
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public full access to employees" ON public.employees;
DROP POLICY IF EXISTS "Public full access to units" ON public.units;
DROP POLICY IF EXISTS "Public full access to repairs" ON public.repairs;
DROP POLICY IF EXISTS "Public full access to sales_transactions" ON public.sales_transactions;
DROP POLICY IF EXISTS "Public full access to system_settings" ON public.system_settings;

-- ------------------------------------------------------------------------------
-- BAGIAN B: ENABLE & FORCE ROW LEVEL SECURITY (RLS)
-- FORCE RLS memastikan table owner pun tunduk pada aturan RLS (kecuali superuser)
-- ------------------------------------------------------------------------------
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units FORCE ROW LEVEL SECURITY;

ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_transactions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings FORCE ROW LEVEL SECURITY;

ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repairs FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- BAGIAN C: CABUT SEMUA HAK AKSES ANON DARI SCHEMA PUBLIC
-- Menutup celah bypass endpoint REST API PostgREST tanpa token JWT
-- ------------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;
REVOKE USAGE ON SCHEMA public FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon;

-- Pastikan authenticated role memiliki hak USAGE pada schema public & sequences
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;

-- ------------------------------------------------------------------------------
-- BAGIAN D: HELPER FUNCTIONS UNTUK ROLE & OTORISASI
-- ------------------------------------------------------------------------------

-- Fungsi: auth_role()
-- Membaca role pengguna dari token JWT (app_metadata -> user_metadata -> lookup employees)
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    (
      SELECT e.role 
      FROM public.employees e 
      WHERE (
        (e.user_id IS NOT NULL AND e.user_id = auth.uid())
        OR (e.email IS NOT NULL AND LOWER(e.email) = LOWER(auth.jwt() ->> 'email'))
      )
      LIMIT 1
    ),
    'authenticated'
  );
$$;

-- Fungsi: is_admin()
-- Mengembalikan true hanya jika role adalah 'owner' atau 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.auth_role() IN ('owner', 'admin');
$$;

-- ------------------------------------------------------------------------------
-- BAGIAN E: KEBIJAKAN AKSES EKSPLISIT (HANYA UNTUK ROLE 'authenticated')
-- ------------------------------------------------------------------------------

-- 1. TABEL: employees
-- SELECT: Pengguna hanya boleh melihat datanya sendiri, KECUALI admin/owner boleh melihat semua
CREATE POLICY "employees_select_policy"
ON public.employees
FOR SELECT
TO authenticated
USING (
  (user_id IS NOT NULL AND user_id = auth.uid())
  OR (email IS NOT NULL AND LOWER(email) = LOWER(auth.jwt() ->> 'email'))
  OR public.is_admin()
);

-- INSERT / UPDATE / DELETE: Hanya admin & owner yang boleh memanipulasi data karyawan
CREATE POLICY "employees_insert_policy"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "employees_update_policy"
ON public.employees
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "employees_delete_policy"
ON public.employees
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 2. TABEL: units
-- SELECT & INSERT: Boleh dilakukan oleh semua staf terautentikasi
CREATE POLICY "units_select_policy"
ON public.units
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "units_insert_policy"
ON public.units
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE & DELETE: Hanya admin & owner yang berhak merubah detail atau menghapus unit
CREATE POLICY "units_update_policy"
ON public.units
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "units_delete_policy"
ON public.units
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 3. TABEL: sales_transactions
-- SELECT & INSERT: Boleh dilakukan oleh semua staf kasir/sales terautentikasi
CREATE POLICY "sales_select_policy"
ON public.sales_transactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "sales_insert_policy"
ON public.sales_transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- CATATAN KEAMANAN AUDIT:
-- Tidak dibuat policy UPDATE atau DELETE pada sales_transactions!
-- Transaksi penjualan bersifat immutable (tidak boleh diedit/dihapus setelah diterbitkan).

-- 4. TABEL: system_settings
-- SELECT: Boleh dibaca oleh staf terautentikasi
CREATE POLICY "settings_select_policy"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- INSERT / UPDATE / DELETE: Hanya admin & owner yang berhak mengubah setelan sistem
CREATE POLICY "settings_insert_policy"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "settings_update_policy"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "settings_delete_policy"
ON public.system_settings
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 5. TABEL: repairs
-- SELECT & INSERT: Terbuka untuk semua staf terautentikasi (mekanik & kasir bengkel)
CREATE POLICY "repairs_select_policy"
ON public.repairs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "repairs_insert_policy"
ON public.repairs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE & DELETE: Hanya admin & owner
CREATE POLICY "repairs_update_policy"
ON public.repairs
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "repairs_delete_policy"
ON public.repairs
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- BAGIAN F: VERIFIKASI POST-MIGRATION
-- (Jalankan query di bawah ini di SQL Editor untuk verifikasi hasil akhir)
-- ------------------------------------------------------------------------------
-- 1. Periksa status RLS & FORCE RLS pada 5 tabel (Harus 't' dan 't' untuk semua baris)
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relnamespace = 'public'::regnamespace 
  AND relname IN ('employees', 'units', 'sales_transactions', 'system_settings', 'repairs');
-- Hasil yang diharapkan:
-- employees          | t | t
-- units              | t | t
-- sales_transactions | t | t
-- system_settings   | t | t
-- repairs            | t | t

-- 2. Periksa hak akses schema public untuk role 'anon' (Harus menghasilkan false)
SELECT nspname, has_schema_privilege('anon', nspname, 'USAGE') 
FROM pg_namespace 
WHERE nspname = 'public';
-- Hasil yang diharapkan:
-- public | false
