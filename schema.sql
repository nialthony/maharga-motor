-- ==============================================================================
-- MAHARGA MOTOR SHOWROOM MANAGEMENT SYSTEM
-- PostgreSQL Database Schema (Compatible with Supabase, Neon, AWS RDS, etc.)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE: employees (Akun Karyawan Showroom)
CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'sales', 'mechanic')),
    email VARCHAR(100),
    phone VARCHAR(25),
    pin VARCHAR(10) NOT NULL DEFAULT '1234',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    joined_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE: units (Katalog & Stok Unit Motor)
CREATE TABLE IF NOT EXISTS units (
    id BIGSERIAL PRIMARY KEY,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    plate VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(50),
    odometer INT DEFAULT 0,
    engine_no VARCHAR(100),
    frame_no VARCHAR(100),
    tax_status VARCHAR(20) DEFAULT 'Hidup' CHECK (tax_status IN ('Hidup', 'Mati Pajak')),
    tax_valid_until DATE,
    tax_dead_years INT DEFAULT 0,
    documents JSONB DEFAULT '["STNK", "BPKB", "Faktur"]'::jsonb,
    condition TEXT,
    buy_price BIGINT NOT NULL DEFAULT 0,
    repair_cost BIGINT DEFAULT 0,
    min_margin_percent INT DEFAULT 10,
    display_price BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Tersedia' CHECK (status IN ('Tersedia', 'Titip DP / Tempo', 'Terjual')),
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    entry_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE: repairs (Log Servis & Bengkel Showroom - Akumulasi HPP)
CREATE TABLE IF NOT EXISTS repairs (
    id BIGSERIAL PRIMARY KEY,
    unit_id BIGINT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    repair_date DATE DEFAULT CURRENT_DATE,
    item VARCHAR(255) NOT NULL,
    mechanic_name VARCHAR(100) NOT NULL,
    cost BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE: sales_transactions (Transaksi Kasir POS Cash & Titip DP)
CREATE TABLE IF NOT EXISTS sales_transactions (
    id VARCHAR(50) PRIMARY KEY,
    unit_id BIGINT REFERENCES units(id) ON DELETE SET NULL,
    unit_name VARCHAR(150) NOT NULL,
    plate VARCHAR(20) NOT NULL,
    sales_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    sales_name VARCHAR(100) NOT NULL,
    buyer_name VARCHAR(100) NOT NULL,
    buyer_phone VARCHAR(25) NOT NULL,
    buyer_address TEXT,
    deal_price BIGINT NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'dp-tempo')),
    dp_amount BIGINT DEFAULT 0,
    remaining_amount BIGINT DEFAULT 0,
    due_date DATE,
    guarantee TEXT,
    commission BIGINT NOT NULL DEFAULT 200000,
    status VARCHAR(30) NOT NULL DEFAULT 'Lunas' CHECK (status IN ('Lunas', 'Tempo Aktif', 'Batal')),
    tx_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLE: system_settings (Konfigurasi Showroom & Rekening Bank)
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. INDEXES (Untuk Kecepatan Pencarian Plat Nomor & Laporan)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_units_plate ON units(plate);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_sales_tx_date ON sales_transactions(tx_date);
CREATE INDEX IF NOT EXISTS idx_sales_sales_id ON sales_transactions(sales_id);
CREATE INDEX IF NOT EXISTS idx_repairs_unit_id ON repairs(unit_id);

-- ==============================================================================
-- 8. DATABASE VIEWS (Laporan Eksekutif & Finansial Real-Time)
-- ==============================================================================

-- View: Rekapitulasi Komisi Staf Sales
CREATE OR REPLACE VIEW view_sales_commissions AS
SELECT 
    e.id AS employee_id,
    e.name AS sales_name,
    e.username,
    COUNT(s.id) AS total_units_sold,
    COALESCE(SUM(s.deal_price), 0) AS total_omset,
    COALESCE(SUM(s.commission), 0) AS total_commission_payout
FROM employees e
LEFT JOIN sales_transactions s ON (e.id = s.sales_id AND s.status IN ('Lunas', 'Tempo Aktif'))
WHERE e.role = 'sales'
GROUP BY e.id, e.name, e.username;

-- View: Rekapitulasi Finansial Showroom (Laba Bersih & HPP)
CREATE OR REPLACE VIEW view_showroom_financials AS
SELECT 
    COALESCE(SUM(deal_price), 0) AS total_omset,
    COALESCE(SUM(deal_price * 0.88), 0) AS est_total_hpp,
    COALESCE(SUM(commission), 0) AS total_commission_expense,
    (COALESCE(SUM(deal_price), 0) - COALESCE(SUM(deal_price * 0.88), 0) - COALESCE(SUM(commission), 0)) AS net_operational_profit
FROM sales_transactions
WHERE status IN ('Lunas', 'Tempo Aktif');

-- ==============================================================================
-- 9. INITIAL SEED DATA (Default Showroom Staff)
-- ==============================================================================
INSERT INTO employees (id, username, name, role, email, phone, pin, status)
VALUES 
    (1, 'owner', 'H. Maharga (Owner)', 'owner', 'owner@mahargamotor.com', '081298765432', '8888', 'active'),
    (2, 'admin_showroom', 'Siti Rahmawati (Admin)', 'admin', 'admin@mahargamotor.com', '085612349876', '1234', 'active'),
    (14, 'anas', 'Anas Nur Cholis', 'sales', 'anas@mahargamotor.com', '081392817290', '1122', 'active'),
    (12, 'dimas', 'Dimas Saputra', 'sales', 'dimas@mahargamotor.com', '087819283741', '3344', 'active'),
    (21, 'budi_mekanik', 'Budi Santoso', 'mechanic', 'budi@mahargamotor.com', '081392847102', '5566', 'active')
ON CONFLICT (username) DO NOTHING;

INSERT INTO system_settings (key, value)
VALUES (
    'showroom_profile',
    '{
        "showroom_name": "Maharga Motor",
        "hotline": "0812-3456-7890",
        "address": "Jl. Raya Solo - Sukoharjo No. 88",
        "bank_accounts": [
            {"bank": "BCA", "number": "0158-992-881", "holder": "Maharga Motor"},
            {"bank": "Mandiri", "number": "138-00-1928374-1", "holder": "Maharga Motor"}
        ],
        "warranty_days": 30,
        "default_commission": 200000
    }'::jsonb
) ON CONFLICT (key) DO NOTHING;
