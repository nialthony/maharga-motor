import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Store, 
  Phone, 
  MapPin, 
  CreditCard, 
  DollarSign, 
  Upload, 
  Check, 
  User,
  Image as ImageIcon
} from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function ShowroomSettings({
  settings,
  onSaveSettings
}) {
  const [formData, setFormData] = useState({
    commission_per_unit: settings?.commission_per_unit || 200000,
    store_phone: settings?.store_phone || '0821-3564-1774',
    store_address: settings?.store_address || 'Jl. Ponggok - Krajan KM.1, Ds Tombol Rt 09/10, Ds. Dalangan, Kec. Tulung, Kab. Klaten',
    cashier_name: settings?.cashier_name || 'Admin Maharga',
    store_logo: settings?.store_logo || '/logo.png',
    license_status: settings?.license_status || 'TERVERIFIKASI EXTEND',
    license_expired: settings?.license_expired || '2027-03-19'
  });

  const [logoPreview, setLogoPreview] = useState(formData.store_logo);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 500KB matching live system)
    if (file.size > 500 * 1024) {
      alert('Ukuran file logo terlalu besar. Maksimal 500KB!');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setLogoPreview(dataUrl);
      setFormData(prev => ({ ...prev, store_logo: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    try {
      if (onSaveSettings) {
        await onSaveSettings(formData);
      }
      setSuccessMsg('Pengaturan sistem dan profil showroom berhasil disimpan.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Gagal simpan pengaturan:', err);
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}



      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 sm:p-6 space-y-6">
        <div className="border-b border-zinc-800 pb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
            Konfigurasi Sistem & Profil Showroom
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Profil Showroom */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Identitas & Kontak Showroom</span>
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-zinc-500" />
                <span>No. WhatsApp / Telepon Showroom</span>
              </label>
              <input
                type="text"
                value={formData.store_phone}
                onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                placeholder="Contoh: 0821-3564-1774"
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-zinc-500" />
                <span>Alamat Lengkap Showroom</span>
              </label>
              <textarea
                rows={3}
                value={formData.store_address}
                onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                placeholder="Masukkan alamat lengkap showroom..."
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-zinc-500">Alamat ini akan dicetak pada bagian header Nota / Kwitansi Penjualan PDF.</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-zinc-500" />
                <span>Nama Kasir Default di Kwitansi</span>
              </label>
              <input
                type="text"
                value={formData.cashier_name}
                onChange={(e) => setFormData({ ...formData, cashier_name: e.target.value })}
                placeholder="Contoh: Admin Maharga"
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Right Column: Keuangan & Logo */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Standar Komisi & Logo</span>
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-zinc-500" />
                <span>Komisi Standar Sales (Per Unit Motor)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={formData.commission_per_unit}
                  onChange={(e) => setFormData({ ...formData, commission_per_unit: Number(e.target.value) || 0 })}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-400"
                />
              </div>
              <span className="text-[10px] text-zinc-500">
                Nominal acuan standar komisi untuk setiap unit motor yang terjual ({formatIDR(formData.commission_per_unit)} / unit).
              </span>
            </div>

            {/* Logo Showroom Upload */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-zinc-500" />
                <span>Logo Showroom (Maks 500KB)</span>
              </label>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1 overflow-hidden shrink-0">
                  <img
                    src={logoPreview}
                    alt="Logo Showroom"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Logo Baru</span>
                  </button>
                  <p className="text-[10px] text-zinc-500">
                    Format disarankan PNG/WEBP transparan (Maks. 500KB).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
