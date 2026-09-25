-- ==============================================================================
-- MIGRATION 0005: ALLOW EMPLOYEES (SALES & MECHANIC) TO UPDATE OWN PROFILE
-- Maharga Motor Showroom Management System
-- Database: Supabase PostgreSQL
-- ==============================================================================

-- 1. Berikan izin UPDATE pada tabel employees agar setiap staf (termasuk role 'sales' dan 'mechanic')
-- dapat memperbarui foto profil (avatar), nomor WhatsApp, dan nama mereka sendiri.
-- Admin dan Owner tetap memiliki hak penuh memperbarui data seluruh karyawan.
DROP POLICY IF EXISTS "employees_update_policy" ON public.employees;

CREATE POLICY "employees_update_policy"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR (user_id IS NOT NULL AND user_id = auth.uid())
  OR (email IS NOT NULL AND LOWER(email) = LOWER(auth.jwt() ->> 'email'))
)
WITH CHECK (
  public.is_admin()
  OR (
    ((user_id IS NOT NULL AND user_id = auth.uid()) OR (email IS NOT NULL AND LOWER(email) = LOWER(auth.jwt() ->> 'email')))
  )
);

-- ==============================================================================
-- CARA PENGGUNAAN DI SUPABASE SQL EDITOR:
-- 1. Buka Supabase Dashboard -> SQL Editor -> Klik "+ New Query"
-- 2. Paste script di atas, lalu klik tombol "RUN" (Cukup sekali RUN).
-- 3. Begitu status "Success", akun Sales sudah dapat menyimpan foto profil dan 
--    perubahan biodatanya ke database Supabase secara permanen.
-- ==============================================================================
