# Maharga Motor - Showroom Management System & Admin Panel

Sistem manajemen operasional showroom motor bekas **Maharga Motor** berbasis Web (React + Tailwind CSS + Lucide Icons) dengan backend statis Cloudflare Pages / Node.js.

---

## 🚀 Fitur Unggulan

### 1. 📸 Admin Panel & Upload Foto Katalog Motor Langsung
- **Tanpa Perlu Redeploy Manual**: Upload foto dari HP / Komputer langsung tersimpan di sistem browser (`localStorage`) dan seketika muncul di Katalog Stok, Kasir POS, dan Dashboard.
- **Pilihan Upload Fleksibel**:
  - File picker langsung dari galeri HP atau komputer.
  - Tempel link URL gambar online.
  - Koleksi preset foto motor showroom (Matic, Maxi, Sport, Retro, Trail).
  - Manajemen multi-foto per unit (atur foto utama thumbnail, hapus sudut foto).
- **Server File Manager (`/public_html`)**: Edit berkas konfigurasi `config.json` dan `.htaccess`.
- **phpMyAdmin SQL Console**: Eksekusi kueri tabel `units`, `sales`, dan `employees`.
- **Domain & SSL**: Status Let's Encrypt Wildcard dan DNS Cloudflare.
- **Backup Wizard**: Ekspor berkas `.sql` dan data showroom.

### 2. 👥 Pemisahan Hak Akses Role
- **👑 Owner / Admin**:
  - **Laporan Finansial & Penggajian Komisi Tim**: Total omset, total modal HPP, margin kotor, laba operasional bersih showroom, dan slip komisi seluruh tim sales.
  - Akses penuh **Admin Panel** & input data unit motor baru.
- **💼 Sales Executive (Anas, Dimas)**:
  - **Laporan Komisi Saya**: Rekap unit terjual dan estimasi komisi cair (Rp 350.000 / unit).
  - Akses POS Penjualan Cash & DP-Tempo.

### 3. 🏍️ Manajemen Transaksi Showroom (No Leasing / Murni Cash & DP-Tempo)
- **Katalog Stok & HPP**: Analisa modal beli, servis bengkel, margin keuntungan, dan status pajak.
- **Kasir Penjualan POS**: Cetak SPK resmi dan Kwitansi bermaterai.
- **Monitoring Titip DP / Tempo**: Pantau jatuh tempo pelunasan pembeli dan jaminan dokumen BPKB/KTP.
- **Bengkel Showroom**: Catatan servis perbaikan unit masuk otomatis menambah HPP.

---

## 📱 Mobile-First Design
- **Sticky Bottom Navigation Bar**: Navigasi satu tangan di smartphone.
- **Mobile Drawer Menu**: Menu geser responsif dan penggantian akun cepat.
- **Responsive Data Cards**: Kartu ringkas otomatis menyesuaikan layar kecil.

---

## 🛠️ Menjalankan Sistem
```bash
# Install dependensi
npm install

# Build untuk Cloudflare Pages / Workers
npm run build

# Menjalankan server preview lokal
npm run preview
```

---

## 🔐 Manajemen Pengguna Supabase Auth & Role Claims

Keamanan sistem menggunakan **Supabase Auth** (`signInWithPassword`) dengan kata sandi minimal 12 karakter dan verifikasi faktor kedua PIN server-side.

### 1. Menambahkan Akun Pengguna di Supabase Dashboard
1. Buka dashboard project Supabase Anda: `https://supabase.com/dashboard/project/<project-id>/auth/users`.
2. Klik **Add User** -> **Create User**.
3. Masukkan Email staf (contoh: `owner@mahargamotor.com`, `admin@mahargamotor.com`, `anas@mahargamotor.com`, `dimas@mahargamotor.com`, `budi@mahargamotor.com`).
4. Tentukan kata sandi kuat (minimal 12 karakter).
5. Centang **Auto Confirm User** agar pengguna langsung aktif tanpa verifikasi email manual.

### 2. Mengatur Claim Role di `app_metadata` (Bukan via SQL langsung ke `auth.users`)
Untuk menetapkan hak akses (`owner`, `admin`, `sales`, atau `mechanic`), atur `app_metadata` pengguna melalui:
- **Supabase Dashboard**: Pada menu *Authentication -> Users*, klik user -> edit *User Metadata / App Metadata*, masukkan JSON:
  ```json
  {
    "role": "owner"
  }
  ```
  *(Gunakan `"owner"`, `"admin"`, `"sales"`, atau `"mechanic"` sesuai posisi staf).*
- **Atau via Supabase Admin API / Node.js script**:
  ```javascript
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role: 'owner' }
  });
  ```

### 3. Menghubungkan ID Pengguna ke Tabel `employees`
Setelah user dibuat di Supabase Auth, salin `User UID` dari dashboard, lalu update baris karyawan yang bersangkutan di Supabase SQL Editor:
```sql
UPDATE public.employees 
SET user_id = '<USER_UUID_DARI_AUTH_USERS>' 
WHERE email = 'owner@mahargamotor.com';
```

### 4. Deploy Supabase Edge Function `verify-pin`
Untuk mengaktifkan verifikasi faktor kedua PIN showroom dengan hashing bcrypt dan proteksi rate limiting:
```bash
# Login Supabase CLI
npx supabase login

# Link project
npx supabase link --project-ref ouuxgwskivkugrndgsiv

# Deploy fungsi verify-pin
npx supabase functions deploy verify-pin
```

