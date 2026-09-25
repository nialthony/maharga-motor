import React, { useState, useRef } from 'react';
import { 
  User, 
  Camera, 
  Trash2, 
  Phone, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Check, 
  X, 
  Calendar,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

/**
 * Kompresi gambar client-side menggunakan HTML5 Canvas
 * Menghasilkan Data URL JPEG berkualitas tinggi dengan ukuran sangat kecil (~25-50KB)
 */
function compressImage(file, maxDimension = 400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung scaling proporsional
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile,
  onSwitchAccount
}) {
  const fileInputRef = useRef(null);
  
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [newPinFactor, setNewPinFactor] = useState('');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !currentUser) return null;

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa foto / gambar (JPG, PNG, WebP).');
      return;
    }

    try {
      setIsProcessingPhoto(true);
      setErrorMsg('');
      const compressedDataUrl = await compressImage(file, 400, 0.85);
      setAvatar(compressedDataUrl);
      setSuccessMsg('Foto profil dipilih. Klik "Simpan Perubahan" untuk menyimpan.');
    } catch (err) {
      console.error('Error saat kompresi foto:', err);
      setErrorMsg('Gagal memproses foto profil. Silakan coba gambar lain.');
    } finally {
      setIsProcessingPhoto(false);
      // Reset input agar bisa pilih ulang file yang sama jika perlu
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setAvatar('');
    setSuccessMsg('Foto profil dihapus. Klik "Simpan Perubahan" untuk menyimpan.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!phone.trim()) {
      setErrorMsg('Nomor WhatsApp / HP tidak boleh kosong.');
      return;
    }

    if (newPassword && newPassword.length < 12) {
      setErrorMsg('Kata sandi baru minimal 12 karakter sesuai standar keamanan.');
      return;
    }

    if (newPinFactor && (newPinFactor.length < 4 || newPinFactor.length > 6)) {
      setErrorMsg('PIN faktor kedua baru harus 4-6 digit.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Jika ada perubahan kata sandi, update di Supabase Auth
      if (newPassword && supabase) {
        const { error: pwdErr } = await supabase.auth.updateUser({ password: newPassword });
        if (pwdErr) throw pwdErr;
      }

      // 2. Jika ada pembaruan PIN faktor kedua, kirim ke Edge Function server
      if (newPinFactor && supabase) {
        await supabase.functions.invoke('verify-pin', {
          body: { action: 'set_pin', factor_code: newPinFactor }
        });
      }

      // 3. Simpan data profil (tanpa kolom pin plaintext!)
      const updatedUser = {
        ...currentUser,
        name: name.trim() || currentUser.name,
        phone: phone.trim(),
        email: email.trim(),
        avatar: avatar || ''
      };

      await onSaveProfile(updatedUser);
      setSuccessMsg('Profil dan keamanan berhasil disimpan!');
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('Gagal simpan profil:', err);
      setErrorMsg('Gagal menyimpan profil ke server. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'admin':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'sales':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'mechanic':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-md">
      <div 
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 id="profile-modal-title" className="text-sm font-bold text-zinc-100 font-mono">
                Profil Pengguna Showroom
              </h3>
              <p className="text-[11px] text-zinc-400">
                Atur foto profil dan perbarui kontak WhatsApp / Email resmi staf.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup jendela profil"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Avatar Section */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-800 border-2 border-amber-500/40 overflow-hidden flex items-center justify-center shadow-lg">
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt={currentUser.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                    {currentUser.username.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Upload trigger button on avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhoto}
                aria-label="Upload foto profil"
                className="absolute inset-0 rounded-full bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-zinc-100 text-[10px] font-bold gap-1 cursor-pointer"
              >
                <Camera className="w-5 h-5 text-amber-400" />
                <span>Ganti</span>
              </button>

              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoSelect} 
              />
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-zinc-100 text-sm">{currentUser.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getRoleBadgeStyle(currentUser.role)}`}>
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">@{currentUser.username}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingPhoto}
                  className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isProcessingPhoto ? 'Memproses...' : 'Upload Foto'}</span>
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-rose-950/50 hover:text-rose-300 text-zinc-400 text-xs font-semibold flex items-center gap-1 border border-zinc-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Editing */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Nama Lengkap Staf:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Contoh: Anas Nur Cholis"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-medium focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Grid No HP & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nomor HP / WhatsApp */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nomor WhatsApp / HP:</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Digunakan untuk kontak resmi & kwitansi.
                </span>
              </div>

              {/* Alamat Email */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Alamat Email:</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staf@mahargamotor.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Notifikasi laporan & korespondensi.
                </span>
              </div>
            </div>

            {/* Ubah Kata Sandi & PIN Faktor Kedua (Server-Side) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800/80">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kata Sandi Baru (Opsional):</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={12}
                    placeholder="Min. 12 karakter"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                    aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Kosongkan jika tidak ingin mengubah sandi.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>PIN Faktor Ke-2 (Opsional):</span>
                </label>
                <input
                  type="password"
                  value={newPinFactor}
                  onChange={(e) => setNewPinFactor(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  placeholder="4-6 digit angka"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 text-xs font-mono font-bold tracking-widest text-center focus:outline-none focus:border-amber-400 transition-colors"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  PIN kedua diverifikasi di server saat login.
                </span>
              </div>
            </div>

            {/* Read-Only System Info */}
            <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-[11px] text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Bergabung: {currentUser.joinedDate || '2024-01-01'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Status Akun: <strong className="text-emerald-400">Aktif</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 justify-between">
              {onSwitchAccount && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchAccount();
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-800 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ganti Akun Lain</span>
                </button>
              )}

              <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
