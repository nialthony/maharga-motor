-- ==============================================================================
-- MIGRATION 0007: PREVENT EMPLOYEE ROLE ESCALATION & PROFILE INTEGRITY
-- Maharga Motor Showroom Management System
-- Database: Supabase PostgreSQL (Security Remediation)
-- Target Table: public.employees
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNGSI TRIGGER: CEGAH PRIVILEGE ESCALATION PADA PROFIL KARYAWAN
-- Memastikan staf biasa (sales/mechanic) hanya dapat memperbarui:
-- - name (nama tampilan)
-- - phone (nomor WhatsApp)
-- - avatar (foto profil)
--
-- Kolom-kolom sensitif:
-- - role (jabatan: owner, admin, sales, mechanic)
-- - status (status akun: active, inactive, suspended)
-- - user_id (kaitan akun auth.users)
-- - username (identitas login)
-- HANYA DAPAT DIUBAH OLEH OWNER / ADMIN (public.is_admin() = true)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_prevent_employee_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Jika bukan admin/owner yang melakukan update, kunci kolom-kolom privilese
    IF NOT public.is_admin() THEN
        -- Larang perubahan role
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Akses Ditolak: Anda tidak memiliki izin untuk mengubah role/jabatan karyawan (Percobaan Privilege Escalation)';
        END IF;

        -- Larang perubahan status (misal mengaktifkan kembali akun yang suspended)
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Akses Ditolak: Hanya Admin atau Owner yang berhak mengubah status keaktifan akun';
        END IF;

        -- Larang pemindahan kaitan user_id auth
        IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
            RAISE EXCEPTION 'Akses Ditolak: ID pengguna auth tidak dapat dipindahkan';
        END IF;

        -- Larang perubahan username
        IF NEW.username IS DISTINCT FROM OLD.username THEN
            RAISE EXCEPTION 'Akses Ditolak: Username karyawan tidak dapat diubah secara mandiri';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Pasang Trigger BEFORE UPDATE pada tabel employees
DROP TRIGGER IF EXISTS trg_prevent_employee_role_escalation_trigger ON public.employees;

CREATE TRIGGER trg_prevent_employee_role_escalation_trigger
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.trg_prevent_employee_role_escalation();

-- ------------------------------------------------------------------------------
-- 2. VERIFIKASI POST-MIGRATION
-- ------------------------------------------------------------------------------
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trg_prevent_employee_role_escalation_trigger';
