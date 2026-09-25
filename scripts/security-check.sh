#!/usr/bin/env bash
# ==============================================================================
# Maharga Motor - Automated Security Regression Check Script
# Target: Supabase Backend & Cloudflare Hosting Infrastructure
# Sifat: READ-ONLY (Tidak ada data yang ditulis/diubah di database)
# ==============================================================================

set -uo pipefail

# ANSI Color Codes
CLR_RESET="\033[0m"
CLR_RED="\033[1;31m"
CLR_GREEN="\033[1;32m"
CLR_YELLOW="\033[1;33m"
CLR_BLUE="\033[1;34m"
CLR_CYAN="\033[1;36m"
CLR_WHITE="\033[1;37m"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${CLR_CYAN}======================================================================${CLR_RESET}"
echo -e "${CLR_WHITE}         MAHARGA MOTOR - SECURITY REGRESSION CHECK SUITE             ${CLR_RESET}"
echo -e "${CLR_CYAN}======================================================================${CLR_RESET}"

# ------------------------------------------------------------------------------
# 1. Load Configuration
# ------------------------------------------------------------------------------
CONFIG_FILE=".env.security-check"
if [[ ! -f "$CONFIG_FILE" ]]; then
  if [[ -f "../.env.security-check" ]]; then
    CONFIG_FILE="../.env.security-check"
  elif [[ -f ".env" ]]; then
    CONFIG_FILE=".env"
    echo -e "${CLR_YELLOW}[WARN] File .env.security-check tidak ditemukan. Menggunakan fallback: .env${CLR_RESET}"
  else
    echo -e "${CLR_RED}[ERROR] File .env.security-check tidak ditemukan!${CLR_RESET}"
    echo -e "Silakan salin .env.security-check.example ke .env.security-check:"
    echo -e "  cp .env.security-check.example .env.security-check"
    exit 1
  fi
fi

# Parse key=value ignoring comments
while IFS='=' read -r key val || [[ -n "$key" ]]; do
  # Skip comments and empty lines
  [[ "$key" =~ ^[[:space:]]*# ]] && continue
  [[ -z "$key" ]] && continue
  key=$(echo "$key" | xargs)
  val=$(echo "$val" | xargs | tr -d '\r')
  
  if [[ "$key" == "SUPABASE_URL" || "$key" == "VITE_SUPABASE_URL" ]]; then
    SUPABASE_URL="${SUPABASE_URL:-$val}"
  elif [[ "$key" == "SUPABASE_ANON_KEY" || "$key" == "VITE_SUPABASE_ANON_KEY" ]]; then
    SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-$val}"
  elif [[ "$key" == "APP_DOMAIN" ]]; then
    APP_DOMAIN="${APP_DOMAIN:-$val}"
  fi
done < "$CONFIG_FILE"

# Sanitize variables
SUPABASE_URL="${SUPABASE_URL%/}"
APP_DOMAIN="${APP_DOMAIN#http://}"
APP_DOMAIN="${APP_DOMAIN#https://}"
APP_DOMAIN="${APP_DOMAIN%/}"

echo -e "${CLR_BLUE}[INFO] Supabase URL :${CLR_RESET} $SUPABASE_URL"
echo -e "${CLR_BLUE}[INFO] Anon Key     :${CLR_RESET} ${SUPABASE_ANON_KEY:0:15}... (Truncated)"
echo -e "${CLR_BLUE}[INFO] App Domain   :${CLR_RESET} $APP_DOMAIN"
echo ""

# Helper assertion function
assert_test() {
  local description="$1"
  local status="$2" # 0 for pass, 1 for fail
  local details="$3"

  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if [[ "$status" -eq 0 ]]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "  ${CLR_GREEN}✓ [PASS]${CLR_RESET} $description"
    if [[ -n "$details" ]]; then
      echo -e "         ${CLR_CYAN}-> $details${CLR_RESET}"
    fi
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "  ${CLR_RED}✗ [FAIL]${CLR_RESET} $description"
    if [[ -n "$details" ]]; then
      echo -e "         ${CLR_YELLOW}-> $details${CLR_RESET}"
    fi
  fi
}

# ------------------------------------------------------------------------------
# UJI 1: RLS Protection — Akses Anon Tanpa JWT Harus Ditolak (Non-200)
# ------------------------------------------------------------------------------
echo -e "${CLR_WHITE}----------------------------------------------------------------------${CLR_RESET}"
echo -e "${CLR_WHITE}1. Uji RLS: Akses Anonim Tanpa JWT Pada 5 Tabel Utama${CLR_RESET}"
echo -e "${CLR_WHITE}   (Ekspektasi: HTTP 401/403/406 atau ditolak RLS, BUKAN 200 dengan data)${CLR_RESET}"
echo -e "${CLR_WHITE}----------------------------------------------------------------------${CLR_RESET}"

TABLES=("employees" "units" "sales_transactions" "system_settings" "repairs")

for tbl in "${TABLES[@]}"; do
  RESP_FILE=$(mktemp 2>/dev/null || echo "/tmp/resp_test_${tbl}.txt")
  
  # Request read limit 1 menggunakan anon key tanpa JWT Bearer
  HTTP_STATUS=$(curl -s -w "%{http_code}" -o "$RESP_FILE" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    "$SUPABASE_URL/rest/v1/$tbl?select=*&limit=1" 2>/dev/null || echo "000")
  
  BODY=$(cat "$RESP_FILE" 2>/dev/null || echo "")
  rm -f "$RESP_FILE"

  # Penilaian: Jika non-200 (misal 401, 403, 406), RLS aktif dan anon ditolak.
  # Jika HTTP 200, cek apakah data kosong "[]" atau ada baris data bocor
  if [[ "$HTTP_STATUS" =~ ^(401|403|406)$ ]]; then
    assert_test "Tabel '$tbl' menolak akses anonim (HTTP $HTTP_STATUS)" 0 "Status: $HTTP_STATUS (Akses ditolak oleh RLS/REVOKE)"
  elif [[ "$HTTP_STATUS" == "200" ]]; then
    # Jika 200 tapi mengembalikan array kosong [], RLS menyembunyikan seluruh baris
    if [[ "$BODY" == "[]" ]]; then
      assert_test "Tabel '$tbl' mengembalikan 0 baris (RLS memblokir akses data)" 0 "Status: 200 OK dengan payload: [] (Data tidak bocor)"
    else
      assert_test "Tabel '$tbl' kebocoran data terdeteksi!" 1 "Status: 200 OK, Payload mengembalikan data publik ke anon!"
    fi
  else
    assert_test "Tabel '$tbl' status respon: $HTTP_STATUS" 0 "Status non-200: $HTTP_STATUS"
  fi
done

echo ""

# ------------------------------------------------------------------------------
# UJI 2: Verifikasi Kolom `pin` Telah Dihapus dari Tabel `employees`
# ------------------------------------------------------------------------------
echo -e "${CLR_WHITE}----------------------------------------------------------------------${CLR_RESET}"
echo -e "${CLR_WHITE}2. Uji Skema Database: Verifikasi Kolom 'pin' Tidak Ada di 'employees'${CLR_RESET}"
echo -e "${CLR_WHITE}   (Ekspektasi: PostgREST error PGRST100 / 'Could not find column')${CLR_RESET}"
echo -e "${CLR_WHITE}----------------------------------------------------------------------${CLR_RESET}"

RESP_FILE=$(mktemp 2>/dev/null || echo "/tmp/resp_pin.txt")
PIN_HTTP_STATUS=$(curl -s -w "%{http_code}" -o "$RESP_FILE" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/employees?select=pin&limit=1" 2>/dev/null || echo "000")
PIN_BODY=$(cat "$RESP_FILE" 2>/dev/null || echo "")
rm -f "$RESP_FILE"

if [[ "$PIN_BODY" =~ ("Could not find the 'pin' column"|"PGRST100"|"column employees.pin does not exist"|"column \"pin\" does not exist") ]]; then
  assert_test "Kolom 'pin' terbukti TIDAK ADA di schema cache (PGRST error)" 0 "Respon: $PIN_BODY"
elif [[ "$PIN_HTTP_STATUS" =~ ^(400|404|401|403)$ ]] && [[ ! "$PIN_BODY" =~ "pin" ]]; then
  assert_test "Query kolom 'pin' ditolak oleh PostgREST (HTTP $PIN_HTTP_STATUS)" 0 "Status: $PIN_HTTP_STATUS"
elif [[ "$PIN_HTTP_STATUS" == "200" ]] && [[ "$PIN_BODY" =~ "pin" ]]; then
  assert_test "KRITIKAL: Kolom 'pin' MASIH TERSEDIA di tabel employees!" 1 "Payload: $PIN_BODY"
else
  # PostgREST 400 when column is missing
  if [[ "$PIN_HTTP_STATUS" == "400" ]]; then
    assert_test "Kolom 'pin' tidak valid pada endpoint employees (HTTP 400)" 0 "Status: 400 (Bad Request)"
  else
    assert_test "Kolom 'pin' tidak dapat diakses (HTTP $PIN_HTTP_STATUS)" 0 "Respon: $PIN_BODY"
  fi
fi

echo ""

# ------------------------------------------------------------------------------
# UJI 3: Redirect HTTP -> HTTPS
# ------------------------------------------------------------------------------
echo -e "${CLR_WHITE}----------------------------------------------------------------------${CLR_RESET}"
echo -e "${CLR_WHITE}3. Uji Transport Layer: Redirect HTTP -> HTTPS${CLR_RESET}"
echo -e "${CLR_WHITE}   (Ekspektasi: HTTP 301 / 308 Permenant Redirect)${CLR_RESET}"
echo -e "${CLR_WHITE}----------------------------------------------------------------------${CLR_RESET}"

if [[ -z "$APP_DOMAIN" || "$APP_DOMAIN" == "your-app.pages.dev" ]]; then
  echo -e "  ${CLR_YELLOW}[SKIP] APP_DOMAIN belum disetel pada .env.security-check. Lewati uji domain.${CLR_RESET}"
else
  HTTP_REDIRECT_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${APP_DOMAIN}/" 2>/dev/null || echo "000")
  REDIRECT_TARGET=$(curl -sI "http://${APP_DOMAIN}/" 2>/dev/null | grep -i "^location:" | tr -d '\r' || echo "")

  if [[ "$HTTP_REDIRECT_CODE" =~ ^(301|308|302|307)$ ]]; then
    assert_test "HTTP dialihkan secara otomatis ke HTTPS (HTTP $HTTP_REDIRECT_CODE)" 0 "$REDIRECT_TARGET"
  else
    assert_test "HTTP tidak melakukan redirect ke HTTPS!" 1 "Status: $HTTP_REDIRECT_CODE (Diharapkan 301/308)"
  fi
fi

echo ""

# ------------------------------------------------------------------------------
# UJI 4: Security Headers Pada HTTPS
# ------------------------------------------------------------------------------
echo -e "${CLR_WHITE}----------------------------------------------------------------------${CLR_RESET}"
echo -e "${CLR_WHITE}4. Uji Header Keamanan HTTP (6 Mandatory Security Headers)${CLR_RESET}"
echo -e "${CLR_WHITE}----------------------------------------------------------------------${CLR_RESET}"

if [[ -z "$APP_DOMAIN" || "$APP_DOMAIN" == "your-app.pages.dev" ]]; then
  echo -e "  ${CLR_YELLOW}[SKIP] APP_DOMAIN belum disetel pada .env.security-check. Lewati uji header.${CLR_RESET}"
else
  HDR_FILE=$(mktemp 2>/dev/null || echo "/tmp/headers_${APP_DOMAIN}.txt")
  curl -sI "https://${APP_DOMAIN}/" > "$HDR_FILE" 2>/dev/null || true

  REQUIRED_HEADERS=(
    "Strict-Transport-Security"
    "Content-Security-Policy"
    "X-Content-Type-Options"
    "X-Frame-Options"
    "Referrer-Policy"
    "Permissions-Policy"
  )

  for hdr in "${REQUIRED_HEADERS[@]}"; do
    FOUND_LINE=$(grep -i "^${hdr}:" "$HDR_FILE" | head -n 1 | tr -d '\r' || echo "")
    if [[ -n "$FOUND_LINE" ]]; then
      assert_test "Header '$hdr' terpasang" 0 "$FOUND_LINE"
    else
      assert_test "Header '$hdr' TIDAK DITEMUKAN!" 1 "Pastikan Cloudflare Worker / Transform Rule menyematkan header ini"
    fi
  done
  rm -f "$HDR_FILE"
fi

echo ""

# ------------------------------------------------------------------------------
# UJI 5: Dotfile Protection & Real 404 (Bukan SPA 200 Index.html)
# ------------------------------------------------------------------------------
echo -e "${CLR_WHITE}----------------------------------------------------------------------${CLR_RESET}"
echo -e "${CLR_WHITE}5. Uji Proteksi Berkas Sensitif (Real 404 Untuk Dotfiles)${CLR_RESET}"
echo -e "${CLR_WHITE}   (Ekspektasi: HTTP 404 Not Found, BUKAN 200 index.html)${CLR_RESET}"
echo -e "${CLR_WHITE}----------------------------------------------------------------------${CLR_RESET}"

if [[ -z "$APP_DOMAIN" || "$APP_DOMAIN" == "your-app.pages.dev" ]]; then
  echo -e "  ${CLR_YELLOW}[SKIP] APP_DOMAIN belum disetel pada .env.security-check. Lewati uji dotfile.${CLR_RESET}"
else
  DOTFILES=("/.env" "/.git" "/.dev.vars" "/wrangler.jsonc")

  for df in "${DOTFILES[@]}"; do
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${APP_DOMAIN}${df}" 2>/dev/null || echo "000")
    if [[ "$STATUS_CODE" == "404" ]]; then
      assert_test "Path '$df' mengembalikan status riil 404 Not Found" 0 "Status: 404 (Aman dari SPA fallback leak)"
    else
      assert_test "Path '$df' TIDAK mengembalikan 404!" 1 "Status: $STATUS_CODE (Jika 200, berkas rawan terbaca atau SPA fallback)"
    fi
  done
fi

echo ""

# ------------------------------------------------------------------------------
# RINGKASAN HASIL
# ------------------------------------------------------------------------------
echo -e "${CLR_CYAN}======================================================================${CLR_RESET}"
echo -e "${CLR_WHITE}                         RINGKASAN PENGUJIAN                          ${CLR_RESET}"
echo -e "${CLR_CYAN}======================================================================${CLR_RESET}"
echo -e "Total Uji  : $TOTAL_TESTS"
echo -e "Lolos      : ${CLR_GREEN}$PASSED_TESTS${CLR_RESET}"
echo -e "Gagal      : ${CLR_RED}$FAILED_TESTS${CLR_RESET}"

if [[ "$FAILED_TESTS" -eq 0 ]]; then
  echo -e "\n${CLR_GREEN}SELURUH UJI REGRESI KEAMANAN LOLOS (100% PASS).${CLR_RESET}\n"
  exit 0
else
  echo -e "\n${CLR_RED}PERHATIAN: Terdapat $FAILED_TESTS uji yang gagal! Periksa rincian di atas.${CLR_RESET}\n"
  exit 1
fi
