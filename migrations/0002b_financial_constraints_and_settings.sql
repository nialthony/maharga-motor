-- ==============================================================================
-- MIGRATION 0002b: FINANCIAL CONSTRAINTS, TRIGGERS & DECOMPOSED SYSTEM SETTINGS
-- Maharga Motor Showroom Management System
-- Database: Supabase PostgreSQL (Production Remediation)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. VALIDASI INTEGRITAS FIELD FINANSIAL (CHECK CONSTRAINTS)
-- Mencegah penulisan angka negatif atau nilai korup pada harga dan komisi
-- ------------------------------------------------------------------------------

-- Tabel: units
ALTER TABLE public.units 
    DROP CONSTRAINT IF EXISTS chk_units_buy_price,
    ADD CONSTRAINT chk_units_buy_price CHECK (buy_price >= 0);

ALTER TABLE public.units 
    DROP CONSTRAINT IF EXISTS chk_units_repair_cost,
    ADD CONSTRAINT chk_units_repair_cost CHECK (repair_cost >= 0);

ALTER TABLE public.units 
    DROP CONSTRAINT IF EXISTS chk_units_min_margin,
    ADD CONSTRAINT chk_units_min_margin CHECK (min_margin_percent >= 0 AND min_margin_percent <= 100);

ALTER TABLE public.units 
    DROP CONSTRAINT IF EXISTS chk_units_display_price,
    ADD CONSTRAINT chk_units_display_price CHECK (display_price >= 0);

-- Tabel: sales_transactions
ALTER TABLE public.sales_transactions
    DROP CONSTRAINT IF EXISTS chk_sales_deal_price,
    ADD CONSTRAINT chk_sales_deal_price CHECK (deal_price > 0);

ALTER TABLE public.sales_transactions
    DROP CONSTRAINT IF EXISTS chk_sales_dp_amount,
    ADD CONSTRAINT chk_sales_dp_amount CHECK (dp_amount >= 0);

ALTER TABLE public.sales_transactions
    DROP CONSTRAINT IF EXISTS chk_sales_remaining_amount,
    ADD CONSTRAINT chk_sales_remaining_amount CHECK (remaining_amount >= 0);

ALTER TABLE public.sales_transactions
    DROP CONSTRAINT IF EXISTS chk_sales_commission,
    ADD CONSTRAINT chk_sales_commission CHECK (commission >= 0 AND commission <= 10000000);

-- Tabel: repairs
ALTER TABLE public.repairs
    DROP CONSTRAINT IF EXISTS chk_repairs_cost,
    ADD CONSTRAINT chk_repairs_cost CHECK (cost >= 0);

-- ------------------------------------------------------------------------------
-- 2. TRIGGER SERVER-SIDE: VALIDASI HUBUNGAN HARGA BELI & HARGA JUAL
-- Memastikan harga jual display tidak lebih rendah dari modal beli
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_validate_unit_finances()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.buy_price > 0 AND NEW.display_price > 0 AND NEW.display_price < NEW.buy_price THEN
        RAISE EXCEPTION 'Validasi Gagal: Harga jual display (Rp %) tidak boleh lebih kecil dari harga modal beli (Rp %)', 
            NEW.display_price, NEW.buy_price;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_unit_finances_trigger ON public.units;
CREATE TRIGGER trg_validate_unit_finances_trigger
BEFORE INSERT OR UPDATE ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.trg_validate_unit_finances();

-- ------------------------------------------------------------------------------
-- 3. RESTRUKTURISASI & DEKOMPOSISI SYSTEM_SETTINGS
-- Mengeliminasi baris global 'maharga_master_state' dan memisahkan ke baris terisolasi
-- ------------------------------------------------------------------------------

-- Tambahkan kolom owner_id / created_by agar pengaturan terikat ke akun owner/admin
ALTER TABLE public.system_settings 
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Hapus baris master snapshot global yang sebelumnya rentan ditimpa data sembarang
DELETE FROM public.system_settings WHERE key = 'maharga_master_state';

-- Pastikan baris-baris pengaturan terpisah terisi dengan format valid:
-- a. Profil Showroom
INSERT INTO public.system_settings (key, value)
VALUES (
    'showroom_profile',
    jsonb_build_object(
        'showroom_name', 'Maharga Motor',
        'hotline', '0812-3456-7890',
        'address', 'Jl. Raya Solo - Sukoharjo No. 88',
        'warranty_days', 30
    )
) ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value - 'bank_accounts' - 'default_commission';

-- b. Daftar Rekening Bank Showroom (Terpisah)
INSERT INTO public.system_settings (key, value)
VALUES (
    'bank_accounts',
    jsonb_build_array(
        jsonb_build_object('bank', 'BCA', 'number', '0158-992-881', 'holder', 'Maharga Motor'),
        jsonb_build_object('bank', 'Mandiri', 'number', '138-00-1928374-1', 'holder', 'Maharga Motor')
    )
) ON CONFLICT (key) DO NOTHING;

-- c. Aturan Finansial & Komisi Showroom (Terpisah & Tervalidasi)
INSERT INTO public.system_settings (key, value)
VALUES (
    'financial_rules',
    jsonb_build_object(
        'default_commission', 200000,
        'min_margin_percent', 10,
        'allowed_commissions', jsonb_build_array(100000, 200000)
    )
) ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. TRIGGER VALIDASI DATA SYSTEM_SETTINGS
-- Memastikan baris financial_rules dan bank_accounts tidak diisi data sembarang
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_validate_system_settings()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validasi aturan finansial
    IF NEW.key = 'financial_rules' THEN
        IF NOT (NEW.value ? 'default_commission' AND (NEW.value->>'default_commission')::bigint >= 0) THEN
            RAISE EXCEPTION 'financial_rules wajib menyertakan default_commission berupa angka non-negatif';
        END IF;
    END IF;

    -- Validasi rekening bank
    IF NEW.key = 'bank_accounts' THEN
        IF jsonb_typeof(NEW.value) <> 'array' THEN
            RAISE EXCEPTION 'bank_accounts harus berupa array JSON berisi daftar rekening';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_system_settings_trigger ON public.system_settings;
CREATE TRIGGER trg_validate_system_settings_trigger
BEFORE INSERT OR UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.trg_validate_system_settings();

-- ------------------------------------------------------------------------------
-- 5. VERIFIKASI POST-MIGRATION
-- ------------------------------------------------------------------------------
-- Periksa ketersediaan baris pengaturan terdekomposisi (Harus memuat 3 baris terpisah)
SELECT key, updated_at 
FROM public.system_settings 
WHERE key IN ('showroom_profile', 'bank_accounts', 'financial_rules');

-- Pastikan maharga_master_state sudah tidak ada lagi
SELECT count(*) AS master_state_count 
FROM public.system_settings 
WHERE key = 'maharga_master_state';
-- Hasil yang diharapkan: 0
