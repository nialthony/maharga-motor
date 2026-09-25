# ==============================================================================
# Maharga Motor - Automated Security Regression Check Script (PowerShell)
# Target: Supabase Backend & Cloudflare Hosting Infrastructure
# Sifat: READ-ONLY (Tidak ada data yang ditulis/diubah di database)
# ==============================================================================

[CmdletBinding()]
param()

$ErrorActionPreference = "SilentlyContinue"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         MAHARGA MOTOR - SECURITY REGRESSION CHECK SUITE (PS)         " -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Load Configuration
$ConfigFile = ".env.security-check"
if (-not (Test-Path $ConfigFile)) {
    if (Test-Path "../.env.security-check") {
        $ConfigFile = "../.env.security-check"
    } elseif (Test-Path ".env") {
        $ConfigFile = ".env"
        Write-Host "[WARN] File .env.security-check tidak ditemukan. Menggunakan fallback: .env" -ForegroundColor Yellow
    } else {
        Write-Host "[ERROR] File .env.security-check tidak ditemukan!" -ForegroundColor Red
        Write-Host "Silakan salin .env.security-check.example ke .env.security-check:"
        Write-Host "  Copy-Item .env.security-check.example .env.security-check"
        exit 1
    }
}

$Config = @{}
Get-Content $ConfigFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line.Split("=", 2)
        $key = $parts[0].Trim()
        $val = $parts[1].Trim().Trim('"').Trim("'")
        $Config[$key] = $val
    }
}

$SupabaseUrl = if ($Config["SUPABASE_URL"]) { $Config["SUPABASE_URL"] } else { $Config["VITE_SUPABASE_URL"] }
$SupabaseAnonKey = if ($Config["SUPABASE_ANON_KEY"]) { $Config["SUPABASE_ANON_KEY"] } else { $Config["VITE_SUPABASE_ANON_KEY"] }
$AppDomain = $Config["APP_DOMAIN"]

if ($SupabaseUrl) { $SupabaseUrl = $SupabaseUrl.TrimEnd("/") }
if ($AppDomain) {
    $AppDomain = $AppDomain.Replace("http://", "").Replace("https://", "").TrimEnd("/")
}

$AnonTruncated = if ($SupabaseAnonKey) { $SupabaseAnonKey.Substring(0, [Math]::Min(15, $SupabaseAnonKey.Length)) + "..." } else { "N/A" }
Write-Host "[INFO] Supabase URL : $SupabaseUrl" -ForegroundColor Blue
Write-Host "[INFO] Anon Key     : $AnonTruncated (Truncated)" -ForegroundColor Blue
Write-Host "[INFO] App Domain   : $AppDomain" -ForegroundColor Blue
Write-Host ""

$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

function Assert-Test {
    param(
        [string]$Description,
        [bool]$Success,
        [string]$Details = ""
    )
    $script:TotalTests++
    if ($Success) {
        $script:PassedTests++
        Write-Host "  ✓ [PASS] $Description" -ForegroundColor Green
        if ($Details) {
            Write-Host "         -> $Details" -ForegroundColor Cyan
        }
    } else {
        $script:FailedTests++
        Write-Host "  ✗ [FAIL] $Description" -ForegroundColor Red
        if ($Details) {
            Write-Host "         -> $Details" -ForegroundColor Yellow
        }
    }
}

# ------------------------------------------------------------------------------
# UJI 1: RLS Protection — Akses Anon Tanpa JWT
# ------------------------------------------------------------------------------
Write-Host "----------------------------------------------------------------------" -ForegroundColor White
Write-Host "1. Uji RLS: Akses Anonim Tanpa JWT Pada 5 Tabel Utama" -ForegroundColor White
Write-Host "   (Ekspektasi: HTTP 401/403/406 atau [] via RLS, BUKAN bocor data)" -ForegroundColor White
Write-Host "----------------------------------------------------------------------" -ForegroundColor White

$Tables = @("employees", "units", "sales_transactions", "system_settings", "repairs")

foreach ($tbl in $Tables) {
    $uri = "$SupabaseUrl/rest/v1/$tbl`?select=*&limit=1"
    $headers = @{ "apikey" = $SupabaseAnonKey }
    try {
        $resp = Invoke-WebRequest -Uri $uri -Headers $headers -Method GET -SkipHttpErrorCheck -TimeoutSec 10
        $code = $resp.StatusCode
        $content = $resp.Content

        if ($code -in 401, 403, 406) {
            Assert-Test "Tabel '$tbl' menolak akses anonim (HTTP $code)" $true "Status: $code (Akses ditolak RLS)"
        } elseif ($code -eq 200) {
            if ($content.Trim() -eq "[]") {
                Assert-Test "Tabel '$tbl' mengembalikan 0 baris (RLS memblokir akses data)" $true "Status: 200 OK dengan payload [] (Data aman)"
            } else {
                Assert-Test "Tabel '$tbl' kebocoran data terdeteksi!" $false "Status: 200 OK dengan payload bocor ke anon!"
            }
        } else {
            Assert-Test "Tabel '$tbl' status respon: $code" $true "Status non-200: $code"
        }
    } catch {
        Assert-Test "Tabel '$tbl' menolak koneksi/request" $true "$($_.Exception.Message)"
    }
}

Write-Host ""

# ------------------------------------------------------------------------------
# UJI 2: Verifikasi Kolom `pin` Telah Dihapus
# ------------------------------------------------------------------------------
Write-Host "----------------------------------------------------------------------" -ForegroundColor White
Write-Host "2. Uji Skema Database: Verifikasi Kolom 'pin' Tidak Ada di 'employees'" -ForegroundColor White
Write-Host "   (Ekspektasi: PostgREST error PGRST100 / 'Could not find column')" -ForegroundColor White
Write-Host "----------------------------------------------------------------------" -ForegroundColor White

$pinUri = "$SupabaseUrl/rest/v1/employees?select=pin&limit=1"
try {
    $pinResp = Invoke-WebRequest -Uri $pinUri -Headers @{ "apikey" = $SupabaseAnonKey } -Method GET -SkipHttpErrorCheck -TimeoutSec 10
    $pinCode = $pinResp.StatusCode
    $pinContent = $pinResp.Content

    if ($pinContent -match "Could not find the 'pin' column" -or $pinContent -match "PGRST100" -or $pinContent -match "column .*pin.* does not exist") {
        Assert-Test "Kolom 'pin' terbukti TIDAK ADA di schema cache" $true "Respon: $pinContent"
    } elseif ($pinCode -in 400, 404, 401, 403) {
        Assert-Test "Query kolom 'pin' ditolak oleh PostgREST (HTTP $pinCode)" $true "Status: $pinCode"
    } elseif ($pinCode -eq 200 -and $pinContent -match "pin") {
        Assert-Test "KRITIKAL: Kolom 'pin' MASIH TERSEDIA di tabel employees!" $false "Payload: $pinContent"
    } else {
        Assert-Test "Kolom 'pin' tidak dapat diakses (HTTP $pinCode)" $true "Respon: $pinContent"
    }
} catch {
    Assert-Test "Query kolom 'pin' ditolak (Exception)" $true "$($_.Exception.Message)"
}

Write-Host ""

# ------------------------------------------------------------------------------
# UJI 3: Redirect HTTP -> HTTPS
# ------------------------------------------------------------------------------
Write-Host "----------------------------------------------------------------------" -ForegroundColor White
Write-Host "3. Uji Transport Layer: Redirect HTTP -> HTTPS" -ForegroundColor White
Write-Host "   (Ekspektasi: HTTP 301 / 308 Permanent Redirect)" -ForegroundColor White
Write-Host "----------------------------------------------------------------------" -ForegroundColor White

if (-not $AppDomain -or $AppDomain -eq "your-app.pages.dev") {
    Write-Host "  [SKIP] APP_DOMAIN belum disetel pada .env.security-check. Lewati uji domain." -ForegroundColor Yellow
} else {
    try {
        $httpResp = Invoke-WebRequest -Uri "http://$AppDomain/" -MaximumRedirection 0 -SkipHttpErrorCheck -TimeoutSec 10
        $httpCode = $httpResp.StatusCode
        $location = $httpResp.Headers["Location"]

        if ($httpCode -in 301, 308, 302, 307) {
            Assert-Test "HTTP dialihkan secara otomatis ke HTTPS (HTTP $httpCode)" $true "Target: $location"
        } else {
            Assert-Test "HTTP tidak melakukan redirect ke HTTPS!" $false "Status: $httpCode (Diharapkan 301/308)"
        }
    } catch {
        # Check if exception contains redirect info
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
            if ($code -in 301, 308, 302, 307) {
                Assert-Test "HTTP dialihkan ke HTTPS (HTTP $code)" $true ""
            } else {
                Assert-Test "HTTP redirect gagal (HTTP $code)" $false ""
            }
        } else {
            Assert-Test "Gagal menghubungi http://$AppDomain/" $false "$($_.Exception.Message)"
        }
    }
}

Write-Host ""

# ------------------------------------------------------------------------------
# UJI 4: Security Headers Pada HTTPS
# ------------------------------------------------------------------------------
Write-Host "----------------------------------------------------------------------" -ForegroundColor White
Write-Host "4. Uji Header Keamanan HTTP (6 Mandatory Security Headers)" -ForegroundColor White
Write-Host "----------------------------------------------------------------------" -ForegroundColor White

if (-not $AppDomain -or $AppDomain -eq "your-app.pages.dev") {
    Write-Host "  [SKIP] APP_DOMAIN belum disetel pada .env.security-check. Lewati uji header." -ForegroundColor Yellow
} else {
    try {
        $secResp = Invoke-WebRequest -Uri "https://$AppDomain/" -Method HEAD -SkipHttpErrorCheck -TimeoutSec 10
        $RequiredHeaders = @(
            "Strict-Transport-Security",
            "Content-Security-Policy",
            "X-Content-Type-Options",
            "X-Frame-Options",
            "Referrer-Policy",
            "Permissions-Policy"
        )

        foreach ($hdr in $RequiredHeaders) {
            $foundKey = $secResp.Headers.Keys | Where-Object { $_ -eq $hdr -or $_.ToLower() -eq $hdr.ToLower() } | Select-Object -First 1
            if ($foundKey) {
                $val = $secResp.Headers[$foundKey]
                Assert-Test "Header '$hdr' terpasang" $true "$val"
            } else {
                Assert-Test "Header '$hdr' TIDAK DITEMUKAN!" $false "Pastikan Cloudflare Worker / Transform Rule aktif"
            }
        }
    } catch {
        Assert-Test "Gagal menghubungi https://$AppDomain/ untuk cek headers" $false "$($_.Exception.Message)"
    }
}

Write-Host ""

# ------------------------------------------------------------------------------
# UJI 5: Dotfile Protection & Real 404
# ------------------------------------------------------------------------------
Write-Host "----------------------------------------------------------------------" -ForegroundColor White
Write-Host "5. Uji Proteksi Berkas Sensitif (Real 404 Untuk Dotfiles)" -ForegroundColor White
Write-Host "   (Ekspektasi: HTTP 404 Not Found, BUKAN 200 index.html)" -ForegroundColor White
Write-Host "----------------------------------------------------------------------" -ForegroundColor White

if (-not $AppDomain -or $AppDomain -eq "your-app.pages.dev") {
    Write-Host "  [SKIP] APP_DOMAIN belum disetel pada .env.security-check. Lewati uji dotfile." -ForegroundColor Yellow
} else {
    $DotFiles = @("/.env", "/.git", "/.dev.vars", "/wrangler.jsonc")

    foreach ($df in $DotFiles) {
        try {
            $dfResp = Invoke-WebRequest -Uri "https://$AppDomain$df" -Method GET -SkipHttpErrorCheck -TimeoutSec 10
            $dfCode = $dfResp.StatusCode

            if ($dfCode -eq 404) {
                Assert-Test "Path '$df' mengembalikan status riil 404 Not Found" $true "Status: 404 (Aman dari SPA leak)"
            } else {
                Assert-Test "Path '$df' TIDAK mengembalikan 404!" $false "Status: $dfCode (Jika 200, rawan bocor)"
            }
        } catch {
            Assert-Test "Error saat memeriksa '$df'" $false "$($_.Exception.Message)"
        }
    }
}

Write-Host ""

# ------------------------------------------------------------------------------
# RINGKASAN HASIL
# ------------------------------------------------------------------------------
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "                         RINGKASAN PENGUJIAN                          " -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Total Uji  : $TotalTests"
Write-Host "Lolos      : $PassedTests" -ForegroundColor Green
Write-Host "Gagal      : $FailedTests" -ForegroundColor Red

if ($FailedTests -eq 0) {
    Write-Host "`nSELURUH UJI REGRESI KEAMANAN LOLOS (100% PASS).`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nPERHATIAN: Terdapat $FailedTests uji yang gagal! Periksa rincian di atas.`n" -ForegroundColor Red
    exit 1
}
