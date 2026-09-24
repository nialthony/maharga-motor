# 🚀 Panduan Deploy Maharga Motor ERP ke Cloudflare Pages

Sistem aplikasi ini dibangun murni menggunakan **React 19 + Vite + Tailwind CSS v4** (Single Page Application / Static Output), sehingga **100% kompatibel dan gratis di Cloudflare Pages**.

---

## 📋 Konfigurasi Build di Cloudflare Pages

Saat menghubungkan repository Git (GitHub / GitLab) ke **Cloudflare Pages Dashboard**, gunakan pengaturan build berikut:

| Parameter | Nilai Pengaturan |
| :--- | :--- |
| **Framework preset** | `Vite` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (atau `maharga-app` jika dalam monorepo) |
| **Node.js Version** | `20` (atau lebih baru) |

---

## ⚡ Cara Deploy 1-Klik via Wrangler CLI (Opsional)

Jika ingin deploy langsung dari terminal tanpa Git:

```bash
# 1. Masuk ke direktori aplikasi
cd /home/user/maharga-app

# 2. Build aplikasi
npm run build

# 3. Deploy langsung ke Cloudflare Pages
npx wrangler pages deploy dist --project-name=maharga-motor
```

---

## 🛠️ Fitur Baru yang Ditambahkan:
1. **cPanel File Manager & Config**:
   * Upload asset gambar banner showroom.
   * Edit konfigurasi JSON (`config.json`), teks syarat ketentuan SPK, dan inspeksi file SQL database backup.
2. **Manajemen Akun & Karyawan**:
   * Tambah/edit akun staf (Role: `Owner`, `Admin Showroom`, `Sales Executive`, `Mekanik QC`).
   * Reset PIN keamanan per karyawan.
   * Tombol aktivasi & penonaktifan akun (Suspend).
3. **Autentikasi Login Admin / Multi-User**:
   * Popup login PIN untuk berganti sesi antara Owner, Admin, dan Sales.
