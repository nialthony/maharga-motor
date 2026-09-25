-- ==============================================================================
-- MIGRATION 0004: ALLOW ADMIN SALES MANAGEMENT & FRESH START
-- Maharga Motor Showroom Management System
-- Database: Supabase PostgreSQL
-- ==============================================================================

-- 1. Berikan hak DELETE pada sales_transactions khusus untuk role 'admin' & 'owner'
-- Ini memungkinkan fitur "Kosongkan Stok & Keuangan" di Admin Panel bekerja tanpa penolakan RLS
DROP POLICY IF EXISTS "sales_delete_policy" ON public.sales_transactions;
CREATE POLICY "sales_delete_policy"
ON public.sales_transactions
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 2. Berikan hak UPDATE pada sales_transactions khusus untuk role 'admin' & 'owner'
-- Berguna untuk pelunasan tempo transaksi atau koreksi data
DROP POLICY IF EXISTS "sales_update_policy" ON public.sales_transactions;
CREATE POLICY "sales_update_policy"
ON public.sales_transactions
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- CARA PENGGUNAAN DI SUPABASE SQL EDITOR:
-- 1. Buka Supabase Dashboard -> SQL Editor -> Klik "+ New Query"
-- 2. Paste script di atas, lalu klik tombol "RUN" (CUKUP SEKALI RUN).
-- 3. Jika ingin mengosongkan SELURUH data stok dan keuangan secara instan sekarang juga,
--    jalankan query di bawah ini:
--
--    TRUNCATE TABLE public.repairs, public.sales_transactions, public.units RESTART IDENTITY CASCADE;
--
-- CATATAN MENGENAI SQL EDITOR:
-- - Tombol "Save" di Supabase SQL Editor hanya menyimpan catatan teks query di sidebar
--   dashboard Anda (bukan berarti query berjalan terus).
-- - Query yang sudah di-RUN sudah langsung berefek permanen ke database PostgreSQL.
-- - Draft query yang di-save boleh dihapus (delete) kapan saja dari dashboard Supabase.
-- ==============================================================================
