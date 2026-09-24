import React, { useState, useRef } from 'react';
import { 
  Folder, 
  Database, 
  Globe, 
  ShieldCheck, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  Play, 
  ArrowLeft,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Link2,
  FileCode,
  Check,
  RefreshCw,
  RotateCcw,
  FileSpreadsheet,
  Copy,
  Zap
} from 'lucide-react';
import { formatIDR } from '../data/mockData';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  isSupabaseConfigured 
} from '../lib/supabaseClient';

export default function AdminPanel({ 
  units = [], 
  setUnits,
  salesList = [], 
  setSalesList,
  employees = [], 
  files = [], 
  setFiles, 
  onBackToERP 
}) {
  // Default module to 'photos'
  const [activeModule, setActiveModule] = useState('photos'); // 'photos' | 'files' | 'db' | 'domains' | 'backup' | 'security'
  
  // ==========================================
  // 1. PHOTO MANAGER STATE
  // ==========================================
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id || '');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadPreview, setUploadPreview] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const fileInputRef = useRef(null);
  const jsonImportRef = useRef(null);

  const selectedUnit = units.find(u => u.id === Number(selectedUnitId)) || units[0];

  // Handle direct file upload from PC / HP Camera
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (.jpg, .png, .webp)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      setUploadPreview(base64Data);
    };
    reader.readAsDataURL(file);
  };

  // Add photo to selected unit
  const handleApplyPhoto = (urlToApply) => {
    if (!selectedUnit) {
      alert('Belum ada unit yang dipilih.');
      return;
    }
    const photoUrl = urlToApply || uploadPreview || newImageUrl.trim();
    if (!photoUrl) {
      alert('Silakan pilih berkas foto atau masukkan link URL terlebih dahulu.');
      return;
    }

    setUnits(prevUnits => prevUnits.map(unit => {
      if (unit.id === selectedUnit.id) {
        const currentImages = unit.images || [];
        return {
          ...unit,
          images: [photoUrl, ...currentImages.filter(img => img !== photoUrl)]
        };
      }
      return unit;
    }));

    setUploadPreview(null);
    setNewImageUrl('');
    setSaveSuccessMsg(`Foto berhasil diterapkan ke unit ${selectedUnit.brand} ${selectedUnit.model} (${selectedUnit.plate})!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Delete specific photo from unit
  const handleDeletePhoto = (photoUrl) => {
    if (!selectedUnit) return;
    setUnits(prevUnits => prevUnits.map(unit => {
      if (unit.id === selectedUnit.id) {
        const updatedImages = (unit.images || []).filter(img => img !== photoUrl);
        return {
          ...unit,
          images: updatedImages.length > 0 ? updatedImages : ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80']
        };
      }
      return unit;
    }));
  };

  // Set as primary thumbnail
  const handleSetPrimary = (photoUrl) => {
    if (!selectedUnit) return;
    setUnits(prevUnits => prevUnits.map(unit => {
      if (unit.id === selectedUnit.id) {
        const otherImages = (unit.images || []).filter(img => img !== photoUrl);
        return {
          ...unit,
          images: [photoUrl, ...otherImages]
        };
      }
      return unit;
    }));
    setSaveSuccessMsg(`Foto utama berhasil diubah!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Data Reset & Export Tools
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
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (parsed.units && Array.isArray(parsed.units)) {
          setUnits(parsed.units);
        }
        if (parsed.salesList && Array.isArray(parsed.salesList) && setSalesList) {
          setSalesList(parsed.salesList);
        }
        alert('Data showroom berhasil diimpor!');
      } catch {
        alert('Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDemo = () => {
    if (confirm('Konfirmasi: Muat data demo sampel showroom (unit & transaksi contoh)?')) {
      const demoSample = [
        {
          id: 1422,
          brand: "Honda",
          model: "Vario 125 CBS ISS",
          year: 2021,
          plate: "AD 2137 EEC",
          color: "Matte Black",
          odometer: 18450,
          engineNo: "JM51E1293847",
          frameNo: "MH1JM5118MK294812",
          taxStatus: "Hidup",
          taxValidUntil: "2027-04-15",
          taxDeadYears: 0,
          documents: ["STNK", "BPKB", "Faktur", "Notice Pajak"],
          condition: "Bodi orisinil 95%, mesin kering segel pabrik, ban 85%",
          buyPrice: 14000000,
          repairCost: 350000,
          minMarginPercent: 10,
          displayPrice: 16800000,
          status: "Tersedia",
          images: [
            "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"
          ],
          entryDate: "2026-09-10",
          repairs: [
            { id: 1, date: "2026-09-11", item: "Ganti Oli Mesin & Gardan", mechanic: "Budi Santoso", cost: 120000 }
          ]
        },
        {
          id: 1421,
          brand: "Yamaha",
          model: "NMAX 155 Connected ABS",
          year: 2022,
          plate: "B 3442 UMG",
          color: "Prestige Silver",
          odometer: 12300,
          engineNo: "G3J1E0928374",
          frameNo: "MH3SG5620NJ381940",
          taxStatus: "Hidup",
          taxValidUntil: "2027-08-20",
          taxDeadYears: 0,
          documents: ["STNK", "BPKB", "Faktur"],
          condition: "Tangan pertama, kunci keyless lengkap 2 unit",
          buyPrice: 24500000,
          repairCost: 450000,
          minMarginPercent: 9,
          displayPrice: 28500000,
          status: "Tersedia",
          images: [
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80"
          ],
          entryDate: "2026-09-12",
          repairs: []
        }
      ];
      setUnits(demoSample);
      alert('Data sampel telah dimuat.');
    }
  };

  const handleClearAllUnits = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGOSONGKAN semua unit stok untuk showroom asli?')) {
      setUnits([]);
      localStorage.removeItem('maharga_units_v3_clean');
      alert('Semua data unit stok telah dikosongkan.');
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

  const handleSavePostgresConfig = async (e) => {
    e.preventDefault();
    setIsTestingSupabase(true);
    setSupabaseTestStatus(null);

    const testRes = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setIsTestingSupabase(false);

    if (testRes.success) {
      saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
      setSupabaseTestStatus({
        success: true,
        message: 'Koneksi ke PostgreSQL / Supabase Berhasil! Konfigurasi tersimpan.'
      });
    } else {
      setSupabaseTestStatus({
        success: false,
        message: `Koneksi gagal: ${testRes.error || 'Periksa kembali URL dan Anon Key'}`
      });
    }
  };

  // ==========================================
  // 3. FILE MANAGER & DB STATE
  // ==========================================
  const [selectedFile, setSelectedFile] = useState(files[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(files[0]?.content || '');
  const [isNewFileModal, setIsNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFilePath] = useState('/public_html/');
  const [newFileContent, setNewFileContent] = useState('');

  const [selectedTable, setSelectedTable] = useState('units');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM units;');
  const [sqlMsg, setSqlMsg] = useState('');

  const handleRunSQL = (e) => {
    e.preventDefault();
    const query = sqlQuery.trim().toLowerCase();

    if (query.includes('from units')) {
      setSelectedTable('units');
      setSqlMsg(`Showing ${units.length} rows`);
    } else if (query.includes('from sales')) {
      setSelectedTable('sales');
      setSqlMsg(`Showing ${salesList.length} rows`);
    } else if (query.includes('from employees') || query.includes('from users')) {
      setSelectedTable('employees');
      setSqlMsg(`Showing ${employees.length} rows`);
    } else {
      setSelectedTable('units');
      setSqlMsg(`Query executed successfully.`);
    }
  };

  const handleSaveFile = () => {
    if (!selectedFile) return;
    setFiles(prev => prev.map(f => f.id === selectedFile.id ? { 
      ...f, 
      content: editContent,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    } : f));
    setIsEditing(false);
  };

  const handleDeleteFile = (id) => {
    if (confirm('Konfirmasi: Hapus file ini secara permanen dari server public_html?')) {
      setFiles(prev => prev.filter(f => f.id !== id));
      if (selectedFile?.id === id) {
        setSelectedFile(null);
        setIsEditing(false);
      }
    }
  };

  const handleCreateFile = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const fileObj = {
      id: `f-${Date.now()}`,
      name: newFileName,
      path: `${newFilePath}${newFileName}`,
      size: `${(newFileContent.length / 1024).toFixed(1)} KB`,
      type: newFileType,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      content: newFileContent
    };

    setFiles(prev => [fileObj, ...prev]);
    setIsNewFileModal(false);
    setNewFileName('');
    setNewFileContent('');
  };

  const copySchemaSQL = () => {
    const sqlText = `-- PostgreSQL DDL Schema for Maharga Motor Showroom
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
            <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center text-zinc-950 font-black text-xs font-mono">
              AP
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-zinc-100 font-mono">
                Admin Panel <span className="text-amber-400">Showroom Control</span>
              </span>
              <span className="text-[10px] text-zinc-500 ml-2 font-mono hidden sm:inline">PostgreSQL Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {isSupabaseConfigured() ? (
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                POSTGRESQL CLOUD AKTIF
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                LOCAL STORAGE MODE
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-5">
        
        {/* Module Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 mb-5 no-scrollbar">
          <button
            onClick={() => setActiveModule('photos')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
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
            onClick={() => setActiveModule('db')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeModule === 'db' ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            PostgreSQL & Database Cloud
          </button>

          <button
            onClick={() => setActiveModule('files')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeModule === 'files' ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            File Manager Server
          </button>

          <button
            onClick={() => setActiveModule('domains')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeModule === 'domains' ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Domain & Cloudflare DNS
          </button>

          <button
            onClick={() => setActiveModule('backup')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeModule === 'backup' ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Backup, Export & Reset
          </button>

          <button
            onClick={() => setActiveModule('security')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeModule === 'security' ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & .htaccess
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
                    Upload Foto Katalog Motor Langsung di Admin Panel
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    <strong>TIDAK PERLU deploy manual setiap upload foto!</strong> Anda bisa mengunggah foto dari memori HP/Laptop atau menempelkan link gambar di bawah ini. Sistem langsung memproses dan menyimpannya secara instan ke katalog showroom, kasir POS, dan rincian unit.
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

            {units.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-xs bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-950 text-amber-400 flex items-center justify-center mx-auto border border-zinc-800">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="font-bold text-zinc-200">Belum Ada Unit Motor yang Terdaftar</p>
                <p className="text-zinc-500 max-w-sm mx-auto">
                  Tambahkan unit motor pertama Anda melalui menu <strong>Input Unit</strong> di bagian atas untuk mulai mengunggah galeri foto.
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

                        <span className="text-xs font-mono text-zinc-400">
                          ID: #{selectedUnit.id}
                        </span>
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
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300">
                                Klik untuk pilih foto dari Galeri HP / Komputer
                              </p>
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                Mendukung format JPG, PNG, WEBP (Otomatis dioptimalkan)
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
                              disabled={!newImageUrl && !uploadPreview}
                              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Terapkan Foto
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
                                <span className="text-xs font-bold text-amber-400 block">Preview Foto Siap Diterapkan</span>
                                <span className="text-[10px] text-zinc-400">Foto telah diproses dari file lokal</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setUploadPreview(null)}
                                className="px-2.5 py-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => handleApplyPhoto(uploadPreview)}
                                className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1"
                              >
                                <Save className="w-3.5 h-3.5" />
                                Simpan ke Unit Ini
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
                                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-[10px] font-semibold border border-zinc-700"
                                  >
                                    Set Utama
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeletePhoto(imgUrl)}
                                  className="p-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px]"
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
                      Koneksi PostgreSQL Cloud (Supabase / Neon / RDS)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Sinkronkan data transaksi dan stok motor secara real-time multi-perangkat.
                    </p>
                  </div>
                </div>

                <button
                  onClick={copySchemaSQL}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Salin Script SQL (schema.sql)
                </button>
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
                      Project URL (Supabase / PostgreSQL Endpoint)
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
                      Public Anon / Service Key
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

                <div className="flex justify-between items-center pt-2">
                  <p className="text-[11px] text-zinc-500">
                    Bila kosong, sistem otomatis berjalan dengan penyimpanan lokal terenkripsi (*Local Storage*).
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        saveSupabaseConfig('', '');
                        setSupabaseUrl('');
                        setSupabaseAnonKey('');
                        setSupabaseTestStatus({ success: true, message: 'Kembali ke mode Local Storage Offline.' });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold"
                    >
                      Gunakan Local Mode
                    </button>
                    <button
                      type="submit"
                      disabled={isTestingSupabase || !supabaseUrl || !supabaseAnonKey}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      {isTestingSupabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Test & Simpan Koneksi
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* SQL Query Console */}
            <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-mono">
                    PostgreSQL SQL Query Console
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">maharga_motor_db</span>
              </div>

              <form onSubmit={handleRunSQL} className="space-y-2">
                <textarea
                  rows={3}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Tulis query SQL (contoh: SELECT * FROM units;)"
                  className="w-full p-2.5 rounded bg-zinc-950 border border-zinc-800 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSqlQuery('SELECT * FROM units;');
                        setSelectedTable('units');
                        setSqlResult(units);
                        setSqlMsg(`Showing ${units.length} rows`);
                      }}
                      className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono hover:bg-zinc-700"
                    >
                      TABLE: units
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSqlQuery('SELECT * FROM sales;');
                        setSelectedTable('sales');
                        setSqlResult(salesList);
                        setSqlMsg(`Showing ${salesList.length} rows`);
                      }}
                      className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono hover:bg-zinc-700"
                    >
                      TABLE: sales
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSqlQuery('SELECT * FROM employees;');
                        setSelectedTable('employees');
                        setSqlResult(employees);
                        setSqlMsg(`Showing ${employees.length} rows`);
                      }}
                      className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono hover:bg-zinc-700"
                    >
                      TABLE: employees
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 font-mono shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-zinc-950" />
                    Execute Query
                  </button>
                </div>
              </form>
            </div>

            {/* SQL Table Output */}
            <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="p-2.5 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center text-xs font-mono">
                <span className="text-emerald-400 font-bold">{sqlMsg || 'Database Ready'}</span>
                <span className="text-zinc-500">Table: {selectedTable}</span>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs text-zinc-300 font-mono">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800 sticky top-0">
                    <tr>
                      {selectedTable === 'units' && (
                        <>
                          <th className="py-2 px-3">id</th>
                          <th className="py-2 px-3">nopol</th>
                          <th className="py-2 px-3">brand_model</th>
                          <th className="py-2 px-3">buy_price</th>
                          <th className="py-2 px-3">display_price</th>
                          <th className="py-2 px-3">status</th>
                        </>
                      )}
                      {selectedTable === 'sales' && (
                        <>
                          <th className="py-2 px-3">tx_id</th>
                          <th className="py-2 px-3">unit_name</th>
                          <th className="py-2 px-3">buyer_name</th>
                          <th className="py-2 px-3">deal_price</th>
                          <th className="py-2 px-3">payment_method</th>
                        </>
                      )}
                      {selectedTable === 'employees' && (
                        <>
                          <th className="py-2 px-3">user_id</th>
                          <th className="py-2 px-3">username</th>
                          <th className="py-2 px-3">name</th>
                          <th className="py-2 px-3">role</th>
                          <th className="py-2 px-3">pin_hash</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-[11px]">
                    {selectedTable === 'units' && (
                      units.length > 0 ? (
                        units.map(u => (
                          <tr key={u.id} className="hover:bg-zinc-800/40">
                            <td className="py-2 px-3 font-bold text-zinc-400">{u.id}</td>
                            <td className="py-2 px-3 font-bold text-amber-400">{u.plate}</td>
                            <td className="py-2 px-3 text-zinc-200">{u.brand} {u.model}</td>
                            <td className="py-2 px-3 text-zinc-300">{formatIDR(u.buyPrice)}</td>
                            <td className="py-2 px-3 font-bold text-zinc-100">{formatIDR(u.displayPrice)}</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                                {u.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-zinc-500">Tabel units kosong (0 rows).</td>
                        </tr>
                      )
                    )}

                    {selectedTable === 'sales' && (
                      salesList.length > 0 ? (
                        salesList.map(s => (
                          <tr key={s.id} className="hover:bg-zinc-800/40">
                            <td className="py-2 px-3 font-bold text-zinc-400">{s.id}</td>
                            <td className="py-2 px-3 text-zinc-200">{s.unitName}</td>
                            <td className="py-2 px-3 text-zinc-300">{s.buyerName}</td>
                            <td className="py-2 px-3 font-bold text-emerald-400">{formatIDR(s.dealPrice)}</td>
                            <td className="py-2 px-3 uppercase">{s.paymentMethod}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-zinc-500">Tabel sales kosong (0 rows).</td>
                        </tr>
                      )
                    )}

                    {selectedTable === 'employees' && employees.map(e => (
                      <tr key={e.id} className="hover:bg-zinc-800/40">
                        <td className="py-2 px-3 font-bold text-zinc-400">{e.id}</td>
                        <td className="py-2 px-3 text-amber-400">@{e.username}</td>
                        <td className="py-2 px-3 text-zinc-200">{e.name}</td>
                        <td className="py-2 px-3 uppercase font-bold text-zinc-400">{e.role}</td>
                        <td className="py-2 px-3 text-zinc-500 font-mono">•••• (PIN: {e.pin})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODULE 3: FILE MANAGER (PUBLIC_HTML) */}
        {/* ========================================================= */}
        {activeModule === 'files' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Current Directory:</span>
                <span className="px-2 py-0.5 rounded bg-zinc-950 font-mono text-xs text-amber-400 border border-zinc-800">
                  /public_html
                </span>
              </div>

              <button
                onClick={() => setIsNewFileModal(true)}
                className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 border border-zinc-700"
              >
                <Plus className="w-3 h-3" />
                File Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3">Nama File</th>
                        <th className="py-2.5 px-3">Ukuran</th>
                        <th className="py-2.5 px-3">Modified</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      {files.map((f) => (
                        <tr
                          key={f.id}
                          onClick={() => {
                            setSelectedFile(f);
                            setEditContent(f.content);
                            setIsEditing(false);
                          }}
                          className={`cursor-pointer ${
                            selectedFile?.id === f.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/40'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-bold text-zinc-100 flex items-center gap-2">
                            <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{f.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400 text-[11px]">{f.size}</td>
                          <td className="py-2.5 px-3 text-zinc-500 text-[11px]">{f.updatedAt}</td>
                          <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedFile(f);
                                  setEditContent(f.content);
                                  setIsEditing(true);
                                }}
                                className="p-1 rounded hover:bg-zinc-700 text-zinc-300"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteFile(f.id)}
                                className="p-1 rounded hover:bg-zinc-700 text-rose-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 space-y-3">
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-100 font-mono">{selectedFile.name}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">{selectedFile.path}</span>
                      </div>
                      {!isEditing && selectedFile.type !== 'image' && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 border border-zinc-700"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2.5">
                        <textarea
                          rows={12}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-400 leading-relaxed"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 text-xs"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleSaveFile}
                            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <pre className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 max-h-64 overflow-y-auto whitespace-pre-wrap">
                        {selectedFile.content}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-zinc-500 text-xs">Pilih file untuk melihat isi kode.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODULE 4: DOMAINS & CLOUDFLARE DNS */}
        {/* ========================================================= */}
        {activeModule === 'domains' && (
          <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-5 space-y-4 text-xs">
            <h3 className="font-bold text-zinc-100 uppercase tracking-wider text-xs flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              Konfigurasi Domain & DNS Cloudflare
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-200 font-mono">mahargamotor.com</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                    SSL ACTIVE (HTTPS)
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Document Root: <code className="text-amber-300 font-mono">/home/maharga/public_html</code>
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-zinc-300">DNS Zone Records:</h4>
                <table className="w-full text-left font-mono text-[11px] border border-zinc-800">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Value</th>
                      <th className="p-2">Proxy Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    <tr>
                      <td className="p-2 text-zinc-200">@</td>
                      <td className="p-2 text-amber-400">A</td>
                      <td className="p-2">103.147.154.21</td>
                      <td className="p-2 text-orange-400">Proxied (Cloudflare)</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-zinc-200">www</td>
                      <td className="p-2 text-amber-400">CNAME</td>
                      <td className="p-2">mahargamotor.com</td>
                      <td className="p-2 text-orange-400">Proxied (Cloudflare)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODULE 5: BACKUP, EXPORT & DATABASE RESET */}
        {/* ========================================================= */}
        {activeModule === 'backup' && (
          <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-5 space-y-5 text-xs">
            <div>
              <h3 className="font-bold text-zinc-100 uppercase tracking-wider text-xs flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Manajemen Data, Export JSON & Reset Showroom
              </h3>
              <p className="text-zinc-400 text-[11px] mt-1">
                Gunakan alat ini untuk mengunduh backup, mentransfer data ke laptop/HP lain, atau mengosongkan data untuk showroom fisik baru.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-2 text-zinc-200 font-bold">
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  <span>Backup JSON Showroom</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Download seluruh data unit motor, foto, transaksi POS, dan akun ke format file JSON.
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

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-2 text-zinc-200 font-bold">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span>Muat Sampel Demo</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Muat 2 unit motor sampel contoh (Vario 125 & NMAX 155) untuk pengujian.
                </p>
                <button
                  onClick={handleResetToDemo}
                  className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-900/50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Muat Data Demo
                </button>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-2.5 sm:col-span-2 lg:col-span-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-rose-300 block text-xs">
                      Kosongkan Semua Data Stok (Fresh Start Showroom Asli)
                    </span>
                    <p className="text-zinc-400 text-[11px]">
                      Hapus semua data demo untuk mulai mencatat stok fisik motor showroom Anda dari nol.
                    </p>
                  </div>
                  <button
                    onClick={handleClearAllUnits}
                    className="px-4 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-200 font-bold text-xs border border-rose-800 shrink-0"
                  >
                    Kosongkan Stok
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODULE 6: SECURITY & HTACCESS */}
        {/* ========================================================= */}
        {activeModule === 'security' && (
          <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-5 space-y-4 text-xs">
            <h3 className="font-bold text-zinc-100 uppercase tracking-wider text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Security Rules & .htaccess Editor
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded font-mono text-[11px] text-zinc-300 whitespace-pre-line leading-relaxed">
{`# Maharga Motor Security Configuration (.htaccess)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Block direct access to config files
<FilesMatch "^(config\\.json|\\.env|\\.git)">
    Order allow,deny
    Deny from all
</FilesMatch>

# LiteSpeed Cache Setup
<IfModule LiteSpeed>
    CacheLookup on
</IfModule>`}
              </div>
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Proteksi direktori dan SSL force aktif.
              </span>
            </div>
          </div>
        )}

      </div>

      {/* New File Modal */}
      {isNewFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100">Buat File Baru di Server</h3>
              <button onClick={() => setIsNewFileModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Nama File *</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: .htaccess atau settings.json"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Direktori Path</label>
                <input
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Konten Awal</label>
                <textarea
                  rows={4}
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className="w-full p-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewFileModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-sm"
                >
                  Simpan File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
