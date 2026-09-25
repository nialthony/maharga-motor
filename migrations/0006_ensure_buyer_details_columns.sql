-- ==============================================================================
-- MIGRATION 0006: ENSURE BUYER DETAILS, PLATE, AND TIMESTAMP COLUMNS IN SALES
-- Maharga Motor Showroom Management System
-- Database: Supabase PostgreSQL
-- ==============================================================================

-- 1. Tambahkan kolom detail pembeli dan identitas transaksi jika belum ada
ALTER TABLE public.sales_transactions ADD COLUMN IF NOT EXISTS plate VARCHAR(30);
ALTER TABLE public.sales_transactions ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(150);
ALTER TABLE public.sales_transactions ADD COLUMN IF NOT EXISTS buyer_phone VARCHAR(50);
ALTER TABLE public.sales_transactions ADD COLUMN IF NOT EXISTS buyer_address TEXT;
ALTER TABLE public.sales_transactions ADD COLUMN IF NOT EXISTS dp_amount BIGINT DEFAULT 0;
ALTER TABLE public.sales_transactions ADD COLUMN IF NOT EXISTS remaining_amount BIGINT DEFAULT 0;
ALTER TABLE public.sales_transactions ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.sales_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. Buat index pencarian cepat untuk nomor plat dan pembeli
CREATE INDEX IF NOT EXISTS idx_sales_transactions_plate ON public.sales_transactions(plate);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_created_at ON public.sales_transactions(created_at);

-- ==============================================================================
-- CARA PENGGUNAAN DI SUPABASE SQL EDITOR:
-- 1. Buka Supabase Dashboard -> SQL Editor -> Klik "+ New Query"
-- 2. Paste script di atas, lalu klik tombol "RUN" (Cukup sekali RUN).
-- 3. Begitu status "Success", seluruh data pembeli (nama, nomor HP/WA, domisili)
--    beserta nomor plat dan jam transaksi akan tersimpan permanen di cloud database.
-- ==============================================================================
