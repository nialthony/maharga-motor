import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Link2,
  Check,
  RefreshCw,
  X,
  FileSpreadsheet,
  Copy,
  Zap,
  Save,
  Loader2
} from 'lucide-react';
import { formatIDR } from '../data/mockData';
import { 
  supabase,
  isSupabaseConfigured,
  getSupabaseConfig, 
  testSupabaseConnection 
} from '../lib/supabaseClient';
import { syncAllToCloud, clearShowroomDataInCloud, deleteUnitFromCloud } from '../lib/cloudStore';
import RoleBadge from './RoleBadge';

export default function AdminPanel({ 
  units = [], 
  setUnits,
  salesList = [], 
  setSalesList,
  employees = [], 
  onBackToERP,
  currentUser
}) {
  // Modul Showroom:
  // 'photos' (Kelola Foto Motor) | 'stok' (Kelola & Hapus Stok Satuan) | 'db' (Koneksi Supabase Cloud) | 'backup' (Backup & Reset)
  const [activeModule, setActiveModule] = useState('photos');
  
  // Single Unit Delete State
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');
  const [stockSearch, setStockSearch] = useState('');

  // ==========================================
  // 1. PHOTO MANAGER STATE & CLOUD LOGIC
  // ==========================================
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id || '');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const fileInputRef = useRef(null);
  const jsonImportRef = useRef(null);

  const selectedUnit = units.find(u => u.id === Number(selectedUnitId)) || units[0];

  const handleDeleteSingleUnit = async (unit) => {
    if (!unit) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus stok motor ini?\n\n• Unit: ${unit.brand} ${unit.model} (${unit.year})\n• Plat: ${unit.plate}\n• Status: ${unit.status}\n\nData akan dihapus permanen dari sistem dan cloud.`
    );
    if (!confirmDelete) return;

    setIsDeletingUnit(true);
    setDeleteSuccessMsg('');
    try {
      const updatedUnits = units.filter(u => u.id !== unit.id);
      setUnits(updatedUnits);

      if (Number(selectedUnitId) === unit.id) {
        setSelectedUnitId(updatedUnits[0]?.id || '');
        setUploadPreview(null);
        setNewImageUrl('');
      }

      await deleteUnitFromCloud(unit.id, updatedUnits, salesList, employees);
      setDeleteSuccessMsg(`Stok ${unit.brand} ${unit.model} (${unit.plate}) berhasil dihapus.`);
      setTimeout(() => setDeleteSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Gagal menghapus unit:', err);
      alert('Terjadi kesalahan saat menghapus unit.');
    } finally {
      setIsDeletingUnit(false);
    }
  };

  // Helper kompresi gambar client-side (Canvas) agar foto kamera HP/laptop cepat diupload dan aman di DB
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Konversi ke JPEG berkualitas baik (~100-150KB)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle direct file upload from PC / HP Camera
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (.jpg, .jpeg, .png, .webp)');
      return;
    }

    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImage(file);
      setUploadPreview(compressedDataUrl);
    } catch (err) {
      console.error('Gagal mengompresi gambar:', err);
      // Fallback: baca langsung
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadPreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  // Terapkan foto dan simpan 100% langsung ke Database Supabase Cloud
  const handleApplyPhoto = async (urlToApply) => {
    if (!selectedUnit) {
      alert('Belum ada unit motor yang dipilih.');
      return;
    }
    const photoUrl = urlToApply || uploadPreview || newImageUrl.trim();
    if (!photoUrl) {
      alert('Silakan pilih berkas foto atau masukkan link URL terlebih dahulu.');
      return;
    }

    setIsSavingPhoto(true);
    setSaveSuccessMsg('');

    try {
      const currentImages = selectedUnit.images || [];
      const updatedImages = [photoUrl, ...currentImages.filter(img => img !== photoUrl)];

      // 1. Update React state
      const nextUnits = units.map(unit => {
        if (unit.id === selectedUnit.id) {
          return {
            ...unit,
            images: updatedImages
          };
        }
        return unit;
      });
      setUnits(nextUnits);

      // 2. Simpan langsung ke Supabase Database Cloud
      if (isSupabaseConfigured() && supabase) {
        const { error: dbError } = await supabase
          .from('units')
          .update({ images: updatedImages })
          .eq('id', selectedUnit.id);

        if (dbError) {
          console.warn('Gagal update tabel units:', dbError);
        }
      }

      setUploadPreview(null);
      setNewImageUrl('');
      setSaveSuccessMsg(`Foto berhasil disimpan ke database cloud untuk unit ${selectedUnit.brand} ${selectedUnit.model} (${selectedUnit.plate})!`);
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Error saat menyimpan foto ke database:', err);
      alert('Gagal menyimpan foto ke database: ' + (err.message || err));
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Hapus foto spesifik dari unit dan update Supabase Cloud
  const handleDeletePhoto = async (photoUrl) => {
    if (!selectedUnit) return;
    setIsSavingPhoto(true);
    try {
      const updatedImages = (selectedUnit.images || []).filter(img => img !== photoUrl);
      const finalImages = updatedImages.length > 0 
        ? updatedImages 
        : ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'];

      const nextUnits = units.map(unit => {
        if (unit.id === selectedUnit.id) {
          return {
            ...unit,
            images: finalImages
          };
        }
        return unit;
      });
      setUnits(nextUnits);

      if (isSupabaseConfigured() && supabase) {
        await supabase
          .from('units')
          .update({ images: finalImages })
          .eq('id', selectedUnit.id);
      }

      setSaveSuccessMsg('Foto berhasil dihapus dan diperbarui di database cloud!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error deleting photo:', err);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Jadikan foto sebagai thumbnail utama
  const handleSetPrimary = async (photoUrl) => {
    if (!selectedUnit) return;
    setIsSavingPhoto(true);
    try {
      const otherImages = (selectedUnit.images || []).filter(img => img !== photoUrl);
      const reorderedImages = [photoUrl, ...otherImages];

      const nextUnits = units.map(unit => {
        if (unit.id === selectedUnit.id) {
          return {
            ...unit,
            images: reorderedImages
          };
        }
        return unit;
      });
      setUnits(nextUnits);

      if (isSupabaseConfigured() && supabase) {
        await supabase
          .from('units')
          .update({ images: reorderedImages })
          .eq('id', selectedUnit.id);
      }

      setSaveSuccessMsg('Foto utama berhasil diubah dan disimpan ke database cloud!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error setting primary photo:', err);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // ==========================================
  // 2. SUPABASE / POSTGRESQL STATE
  // ==========================================
  const currentSupabase = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentSupabase.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(currentSupabase.anonKey || '');
  const [supabaseTestStatus, setSupabaseTestStatus] = useState(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const handleSavePostgresConfig = async (e) => {
    e.preventDefault();
    setIsTestingSupabase(true);
    setSupabaseTestStatus(null);

    const testRes = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setIsTestingSupabase(false);

    if (testRes.success) {
      setSupabaseTestStatus({
        success: true,
        message: 'Koneksi ke PostgreSQL Supabase Berhasil! Endpoint aktif dan terhubung.'
      });
    } else {
      setSupabaseTestStatus({
        success: false,
        message: `Koneksi gagal: ${testRes.error || 'Periksa kembali URL dan Anon Key'}`
      });
    }
  };

  const handleForceSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const ok = await syncAllToCloud(units, salesList, employees);
      if (ok) {
        alert('Seluruh data stok, transaksi, dan akun berhasil disinkronkan ke Supabase Cloud!');
      } else {
        alert('Gagal menyinkronkan data. Pastikan koneksi Supabase terhubung.');
      }
    } catch (err) {
      alert('Error sinkronisasi: ' + err.message);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const copySchemaSQL = () => {
    const sqlText = `-- PostgreSQL DDL Schema for Maharga Motor Showroom
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  user_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  joined_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS units (
  id BIGSERIAL PRIMARY KEY,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  plate VARCHAR(20) UNIQUE NOT NULL,
  buy_price BIGINT NOT NULL DEFAULT 0,
  repair_cost BIGINT DEFAULT 0,
  display_price BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Tersedia',
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_transactions (
  id VARCHAR(50) PRIMARY KEY,
  unit_id BIGINT REFERENCES units(id),
  unit_name VARCHAR(150),
  deal_price BIGINT NOT NULL,
  sales_name VARCHAR(100),
  buyer_name VARCHAR(100),
  commission BIGINT DEFAULT 200000,
  payment_method VARCHAR(30),
  status VARCHAR(30) DEFAULT 'Lunas',
  tx_date DATE DEFAULT CURRENT_DATE
);`;
    navigator.clipboard.writeText(sqlText);
    alert('Script PostgreSQL (schema.sql) berhasil disalin ke clipboard!');
  };

  // ==========================================
  // 3. BACKUP, EXPORT & RESET DATA
  // ==========================================
  const handleExportJSON = () => {
    const dataDump = {
      showroom: "Maharga Motor",
      exportedAt: new Date().toISOString(),
      units,
      salesList,
      employees
    };
    const blob = new Blob([JSON.stringify(dataDump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maharga_showroom_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        let nextUnits = units;
        let nextSales = salesList;

        if (parsed.units && Array.isArray(parsed.units)) {
          nextUnits = parsed.units;
          setUnits(parsed.units);
        }
        if (parsed.salesList && Array.isArray(parsed.salesList) && setSalesList) {
          nextSales = parsed.salesList;
          setSalesList(parsed.salesList);
        }
        
        await syncAllToCloud(nextUnits, nextSales, employees);
        alert('Data showroom berhasil diimpor dan disinkronkan ke cloud!');
      } catch {
        alert('Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetShowroomData = async () => {
    const confirmed = confirm(
      'PERINGATAN RESET SHOWROOM (FRESH START):\n\n' +
      'Tindakan ini akan mengosongkan:\n' +
      '1. Seluruh unit stok motor (katalog kembali 0 unit)\n' +
      '2. Seluruh catatan transaksi penjualan & laporan keuangan (omset kembali Rp 0)\n' +
      '3. Seluruh catatan piutang titip DP / tempo\n\n' +
      'Data akun staf karyawan & koneksi Supabase tetap aman tersimpan.\n\n' +
      'Apakah Anda yakin ingin mengosongkan stok dan keuangan?'
    );
    if (!confirmed) return;

    setIsResetting(true);
    try {
      await clearShowroomDataInCloud(employees);

      setUnits([]);
      if (setSalesList) setSalesList([]);
      
      localStorage.setItem('maharga_units_v3_clean', JSON.stringify([]));
      localStorage.setItem('maharga_sales_v3_clean', JSON.stringify([]));

      alert('Sukses! Seluruh data stok motor dan catatan keuangan telah dikosongkan.');
    } catch (err) {
      console.error('Gagal reset showroom:', err);
      alert('Gagal mengosongkan data di cloud: ' + (err.message || err));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20">
      {/* Top Admin Bar */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToERP}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition-colors mr-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kembali ke</span> Showroom
            </button>
            <img 
              src="/logo.png" 
              alt="Maharga Motor Logo" 
              className="h-8 sm:h-9 w-auto object-contain transition-transform hover:scale-105" 
            />
            <RoleBadge role={currentUser?.role || 'admin'} className="h-6 sm:h-7 w-auto" />
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-5">
        
        {/* Clean Module Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 mb-5 no-scrollbar">
          <button
            onClick={() => setActiveModule('photos')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeModule === 'photos' 
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm' 
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Kelola Foto & Galeri Motor</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-950/30">
              {units.length} Unit
            </span>
          </button>

          <button
            onClick={() => setActiveModule('stok')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeModule === 'stok' 
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm' 
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Kelola & Hapus Stok Satuan</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-950/30">
              {units.length} Unit
            </span>
          </button>

          <button
            onClick={() => setActiveModule('db')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeModule === 'db' 
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm' 
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Koneksi Supabase Cloud</span>
          </button>

          <button
            onClick={() => setActiveModule('backup')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeModule === 'backup' 
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm' 
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup & Reset Data</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* MODULE 1: MOTOR PHOTO & MEDIA MANAGER */}
        {/* ========================================================= */}
        {activeModule === 'photos' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-800/40 rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-100">
                    Upload & Simpan Foto Motor Langsung ke Database
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Unggah foto motor dari galeri HP atau laptop. Foto otomatis dioptimalkan ukurannya dan <strong>langsung tersimpan permanen di database Supabase Cloud</strong>, sehingga langsung terlihat di katalog dan kasir pada seluruh perangkat staf.
                  </p>
                </div>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {deleteSuccessMsg && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Trash2 className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{deleteSuccessMsg}</span>
              </div>
            )}

            {units.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-xs bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-950 text-amber-400 flex items-center justify-center mx-auto border border-zinc-800">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="font-bold text-zinc-200">Belum Ada Unit Motor yang Terdaftar</p>
                <p className="text-zinc-500 max-w-sm mx-auto">
                  Tambahkan unit motor terlebih dahulu untuk mulai mengunggah galeri foto.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left Column: Select Motor Unit */}
                <div className="space-y-4">
                  <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        1. Pilih Unit Motor
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">{units.length} Unit</span>
                    </h3>

                    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                      {units.map((unit) => {
                        const isSelected = unit.id === selectedUnit?.id;
                        const thumb = unit.images?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80';
                        return (
                          <div
                            key={unit.id}
                            onClick={() => {
                              setSelectedUnitId(unit.id);
                              setUploadPreview(null);
                              setNewImageUrl('');
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                              isSelected 
                                ? 'bg-zinc-800 border-amber-500/80 shadow-md ring-1 ring-amber-500/50' 
                                : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700'
                            }`}
                          >
                            <img 
                              src={thumb} 
                              alt={unit.model} 
                              className="w-12 h-12 rounded-lg object-cover bg-zinc-900 border border-zinc-800 shrink-0" 
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-zinc-100 truncate">
                                {unit.brand} {unit.model} ({unit.year})
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono font-bold text-amber-400">{unit.plate}</span>
                                <span className="text-[10px] text-zinc-400">{formatIDR(unit.displayPrice)}</span>
                              </div>
                              <span className="text-[9px] text-zinc-500">
                                {(unit.images?.length || 1)} foto terdaftar
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSingleUnit(unit);
                              }}
                              disabled={isDeletingUnit}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/60 transition-colors shrink-0"
                              title={`Hapus ${unit.brand} ${unit.model} (${unit.plate})`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Middle & Right Column: Photo Uploader & Live Gallery */}
                <div className="lg:col-span-2 space-y-4">
                  {selectedUnit && (
                    <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 sm:p-5 space-y-4">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                              {selectedUnit.brand} {selectedUnit.model} ({selectedUnit.year})
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
                              {selectedUnit.plate}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Status: <strong className="text-zinc-200">{selectedUnit.status}</strong> • Harga Display: <strong>{formatIDR(selectedUnit.displayPrice)}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-500">
                            ID: #{selectedUnit.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleUnit(selectedUnit)}
                            disabled={isDeletingUnit}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            title="Hapus unit ini dari stok showroom"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Hapus Unit</span>
                          </button>
                        </div>
                      </div>

                      {/* Uploader Dropzone / Input Area */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                          2. Upload Foto Baru untuk Unit Ini
                        </label>

                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-zinc-700 hover:border-amber-400 rounded-xl p-5 text-center cursor-pointer bg-zinc-950/60 hover:bg-zinc-950 transition-all group"
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-amber-500 group-hover:text-zinc-950 text-zinc-300 flex items-center justify-center transition-colors">
                              {isCompressing ? (
                                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                              ) : (
                                <Upload className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300">
                                {isCompressing ? 'Mengoptimalkan foto...' : 'Klik untuk pilih foto dari Galeri HP / Komputer'}
                              </p>
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                Mendukung JPG, PNG, WEBP (Otomatis dikompres & disimpan ke database)
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Link Input */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] text-zinc-400 font-medium">Atau tempel Link / URL Gambar:</span>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Link2 className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                              <input
                                type="url"
                                placeholder="https://... (URL foto motor online)"
                                value={newImageUrl}
                                onChange={(e) => {
                                  setNewImageUrl(e.target.value);
                                  setUploadPreview(null);
                                }}
                                className="w-full pl-8 pr-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyPhoto()}
                              disabled={isSavingPhoto || (!newImageUrl && !uploadPreview)}
                              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                            >
                              {isSavingPhoto ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Menyimpan...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Simpan Foto</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {uploadPreview && (
                          <div className="p-3 rounded-xl bg-zinc-950 border border-amber-500/50 flex items-center justify-between gap-3 animate-in fade-in">
                            <div className="flex items-center gap-3">
                              <img 
                                src={uploadPreview} 
                                alt="Upload preview" 
                                className="w-14 h-14 rounded-lg object-cover border border-zinc-700" 
                              />
                              <div>
                                <span className="text-xs font-bold text-amber-400 block">Preview Foto Siap Simpan</span>
                                <span className="text-[10px] text-zinc-400">Ukuran telah dioptimalkan untuk database cloud</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setUploadPreview(null)}
                                disabled={isSavingPhoto}
                                className="px-2.5 py-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => handleApplyPhoto(uploadPreview)}
                                disabled={isSavingPhoto}
                                className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                              >
                                {isSavingPhoto ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Menyimpan ke DB...</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Simpan ke Database</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Active Photos Gallery */}
                      <div className="pt-4 border-t border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                            Galeri Foto Aktif Unit Ini ({(selectedUnit.images || []).length})
                          </h4>
                          <span className="text-[10px] text-zinc-500">
                            Foto pertama otomatis menjadi Thumbnail Utama
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {(selectedUnit.images || []).map((imgUrl, index) => (
                            <div 
                              key={index}
                              className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video"
                            >
                              <img 
                                src={imgUrl} 
                                alt={`Unit angle ${index + 1}`} 
                                className="w-full h-full object-cover" 
                              />

                              {index === 0 && (
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-bold text-[9px] font-mono shadow">
                                  UTAMA
                                </span>
                              )}

                              <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity p-2">
                                {index !== 0 && (
                                  <button
                                    onClick={() => handleSetPrimary(imgUrl)}
                                    disabled={isSavingPhoto}
                                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-[10px] font-semibold border border-zinc-700"
                                  >
                                    Set Utama
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeletePhoto(imgUrl)}
                                  disabled={isSavingPhoto}
                                  className="p-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px]"
                                  title="Hapus foto dari database"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODULE: KELOLA & HAPUS STOK SATUAN */}
        {/* ========================================================= */}
        {activeModule === 'stok' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-rose-950/40 via-zinc-900 to-zinc-900 border border-rose-900/40 rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    Kelola & Hapus Stok Motor Satuan
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Hapus unit motor tertentu dari database tanpa mereset data showroom lainnya. Perubahan otomatis disinkronkan ke Supabase Cloud dan seluruh perangkat staf.
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-400 font-bold shrink-0">
                  {units.length} Unit Terdaftar
                </span>
              </div>
            </div>

            {deleteSuccessMsg && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{deleteSuccessMsg}</span>
              </div>
            )}

            {/* Filter Search */}
            <div className="flex items-center gap-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Cari merk, model, plat nomor motor untuk dihapus..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            {/* Table of Units */}
            {units.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-xs bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-2">
                <p className="font-bold text-zinc-200">Tidak ada stok motor terdaftar</p>
                <p className="text-zinc-500">Semua unit telah dihapus atau belum ada input unit baru.</p>
              </div>
            ) : (
              <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                      <tr>
                        <th className="py-3 px-4">Foto & Motor</th>
                        <th className="py-3 px-4">Plat Nomor</th>
                        <th className="py-3 px-4">Tahun / Warna</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 font-mono">HPP Modal</th>
                        <th className="py-3 px-4 font-mono">Harga Display</th>
                        <th className="py-3 px-4 text-center">Aksi Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {units
                        .filter(u => 
                          u.model?.toLowerCase().includes(stockSearch.toLowerCase()) ||
                          u.brand?.toLowerCase().includes(stockSearch.toLowerCase()) ||
                          u.plate?.toLowerCase().includes(stockSearch.toLowerCase()) ||
                          u.color?.toLowerCase().includes(stockSearch.toLowerCase())
                        )
                        .map((unit) => {
                          const thumb = unit.images?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80';
                          return (
                            <tr key={unit.id} className="hover:bg-zinc-800/40 transition-colors">
                              <td className="py-2.5 px-4 flex items-center gap-3">
                                <img 
                                  src={thumb} 
                                  alt={unit.model} 
                                  className="w-10 h-10 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0" 
                                />
                                <div>
                                  <div className="font-bold text-zinc-100">{unit.brand} {unit.model}</div>
                                  <div className="text-[10px] text-zinc-500 font-mono">ID: #{unit.id}</div>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{unit.plate}</td>
                              <td className="py-2.5 px-4">{unit.year} • {unit.color}</td>
                              <td className="py-2.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  unit.status === 'Tersedia' 
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                  {unit.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-zinc-300">{formatIDR(unit.buyPrice || 0)}</td>
                              <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{formatIDR(unit.displayPrice || 0)}</td>
                              <td className="py-2.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSingleUnit(unit)}
                                  disabled={isDeletingUnit}
                                  className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 mx-auto hover:scale-105 active:scale-95 disabled:opacity-50"
                                  title={`Hapus ${unit.brand} ${unit.model}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Hapus Unit</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODULE 2: POSTGRESQL & SUPABASE CLOUD CONNECTION */}
        {/* ========================================================= */}
        {activeModule === 'db' && (
          <div className="space-y-5">
            {/* Supabase PostgreSQL Live Connection Settings */}
            <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">
                      Koneksi Supabase Cloud Database (PostgreSQL)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Semua perubahan data stok, foto, dan transaksi tersinkronisasi otomatis antar device.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleForceSyncAll}
                    disabled={isSyncingAll}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                    <span>{isSyncingAll ? 'Sinkronisasi...' : 'Sinkronkan Data Sekarang'}</span>
                  </button>
                  <button
                    onClick={copySchemaSQL}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin SQL Schema
                  </button>
                </div>
              </div>

              {supabaseTestStatus && (
                <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  supabaseTestStatus.success 
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300' 
                    : 'bg-rose-950 border border-rose-800 text-rose-300'
                }`}>
                  {supabaseTestStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                  <span>{supabaseTestStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleSavePostgresConfig} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      Project URL (Supabase Endpoint)
                    </label>
                    <input
                      type="url"
                      placeholder="https://xyzproject.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      Public Anon / Publishable Key
                    </label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                  <p className="text-[11px] text-zinc-400">
                    Endpoint aktif: <span className="text-amber-400 font-mono">{supabaseUrl || 'Belum diatur'}</span>
                  </p>
                  <button
                    type="submit"
                    disabled={isTestingSupabase || !supabaseUrl || !supabaseAnonKey}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    {isTestingSupabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Test & Simpan Koneksi
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-[11px] text-zinc-400 font-medium">Unit Motor di Cloud</span>
                <p className="text-2xl font-bold font-mono text-zinc-100">{units.length} Unit</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-[11px] text-zinc-400 font-medium">Transaksi Penjualan</span>
                <p className="text-2xl font-bold font-mono text-zinc-100">{salesList.length} Transaksi</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="text-[11px] text-zinc-400 font-medium">Akun Staf Terdaftar</span>
                <p className="text-2xl font-bold font-mono text-zinc-100">{employees.length} Akun</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODULE 3: BACKUP, EXPORT & DATABASE RESET */}
        {/* ========================================================= */}
        {activeModule === 'backup' && (
          <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-5 space-y-5 text-xs">
            <div>
              <h3 className="font-bold text-zinc-100 uppercase tracking-wider text-xs flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Manajemen Data, Export JSON & Reset Showroom
              </h3>
              <p className="text-zinc-400 text-[11px] mt-1">
                Unduh salinan cadangan (backup) seluruh data showroom, pulihkan data lama, atau kosongkan data sampel untuk mulai operasional showroom fisik asli.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-2 text-zinc-200 font-bold">
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  <span>Backup JSON Showroom</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Download seluruh data unit motor, foto galeri, transaksi POS, dan akun ke format file JSON.
                </p>
                <button
                  onClick={handleExportJSON}
                  className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Backup (.json)
                </button>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-2 text-zinc-200 font-bold">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Import / Restore Data</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Pulihkan data showroom dari file JSON backup yang pernah Anda unduh sebelumnya.
                </p>
                <input
                  type="file"
                  ref={jsonImportRef}
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
                <button
                  onClick={() => jsonImportRef.current?.click()}
                  className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Pilih File Backup (.json)
                </button>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-2.5 sm:col-span-2">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-rose-300 block text-xs">
                      Kosongkan Stok & Reset Catatan Keuangan (Fresh Start Showroom Asli)
                    </span>
                    <p className="text-zinc-400 text-[11px]">
                      Hapus seluruh data stok sampel dan riwayat transaksi demo agar stok motor dan laporan keuangan mulai bersih dari nol (Stok 0, Omset Rp 0). Data akun staf tetap tersimpan.
                    </p>
                  </div>
                  <button
                    onClick={handleResetShowroomData}
                    disabled={isResetting}
                    className="px-4 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 disabled:opacity-50 text-rose-200 font-bold text-xs border border-rose-800 shrink-0 flex items-center gap-1.5"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengosongkan...</span>
                      </>
                    ) : (
                      <span>Kosongkan Stok & Keuangan</span>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
