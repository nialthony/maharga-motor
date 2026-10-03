import React, { useState, useRef } from 'react';
import { 
  X, 
  Calculator,
  Upload,
  Image as ImageIcon,
  Check,
  ShieldCheck,
  Wrench
} from 'lucide-react';
import { formatIDR, initialBrands, initialTypes } from '../data/mockData';
import { generateUnitId } from '../lib/cloudStore';
import { compressImageBlob, uploadUnitPhoto } from '../lib/imageStorage';

export default function NewUnitModal({ 
  isOpen, 
  onClose, 
  onAddUnit, 
  brands = initialBrands, 
  types = initialTypes 
}) {
  // Foto bawaan bila operator tidak mengunggah apa pun. Foto yang dipilih akan
  // diunggah ke Supabase Storage; hanya PATH-nya yang disimpan ke database.
  const DEFAULT_UNIT_IMAGE = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80';

  const [brand, setBrand] = useState('Honda');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(2023);
  
  // 3-Part Plate Input matching live system (nopol_1, nopol_2, nopol_3)
  const [nopol1, setNopol1] = useState('AD');
  const [nopol2, setNopol2] = useState('');
  const [nopol3, setNopol3] = useState('');

  const [color, setColor] = useState('Hitam');
  const [odometer, setOdometer] = useState(12000);
  const [taxStatus, setTaxStatus] = useState('Hidup');
  const [taxValidUntil, setTaxValidUntil] = useState('2027-05-10');
  const [taxDeadYears, setTaxDeadYears] = useState(0);
  const [condition, setCondition] = useState('Bodi orisinil mulus, mesin segel pabrik, ban 85%');
  
  // Kelengkapan Dokumen (STNK, BPKB, Faktur, KTP Pemilik)
  const [documents, setDocuments] = useState(['STNK', 'BPKB', 'Faktur']);
  
  // Alur Status Unit Masuk: Masuk Bengkel (Perbaikan) -> Belum Tersedia -> Tersedia (Siap Jual)
  const [status, setStatus] = useState('Perbaikan');

  // Analisa Modal & Kebijakan Harga Jual
  const [buyPrice, setBuyPrice] = useState(15000000);
  const [minMarginPercent, setMinMarginPercent] = useState(10);
  const [displayPrice, setDisplayPrice] = useState(17500000);

  const [uploadPreview, setUploadPreview] = useState(null);
  // Berkas asli disimpan supaya saat submit bisa dikompres lalu diunggah ke storage.
  // (Sebelumnya hanya base64 yang disimpan, lalu base64 itu ikut masuk DATABASE.)
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef(null);

  // Available document options matching live system
  const availableDocs = ['STNK', 'BPKB', 'Faktur', 'KTP Pemilik'];

  // Filter models based on selected brand
  const brandModels = types.filter(t => t.brandName?.toLowerCase() === brand.toLowerCase() || t.brandId === brands.find(b => b.name === brand)?.id);

  // Set default model when brand changes
  const handleBrandChange = (newBrand) => {
    setBrand(newBrand);
    const matched = types.filter(t => t.brandName?.toLowerCase() === newBrand.toLowerCase() || t.brandId === brands.find(b => b.name === newBrand)?.id);
    if (matched.length > 0) {
      setModel(matched[0].name);
    }
  };

  // Recalculate minimum selling price dynamically
  const totalModal = Number(buyPrice) || 0;
  const minPrice = Math.round(totalModal * (1 + ((Number(minMarginPercent) || 0) / 100)));

  const toggleDocument = (doc) => {
    setDocuments(prev => 
      prev.includes(doc) 
        ? prev.filter(d => d !== doc) 
        : [...prev, doc]
    );
  };

  // Handle local file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5 MB = batas berkas bucket 'showroom-assets'. Foto dikecilkan otomatis
    // (sisi terpanjang 1200px, JPEG q0.82 -> biasanya < 200 KB) sebelum diunggah.
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar. Maksimal 5 MB (akan dikompres otomatis).');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      // Hanya untuk PRATINJAU di dalam form — bukan nilai yang disimpan.
      setUploadPreview(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalPlate = `${nopol1.trim()} ${nopol2.trim()} ${nopol3.trim()}`.trim().toUpperCase();
    if (!model.trim() || !finalPlate) {
      alert('Mohon lengkapi data merk, model, dan nomor polisi unit.');
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    setSaveError('');

    // ---------------------------------------------------------------------
    // FOTO: unggah ke bucket private 'showroom-assets', lalu simpan PATH-nya
    // ke kolom units.images. Yang TIDAK boleh lagi: menyimpan base64 di
    // database — itu penyebab utama kuota Supabase (500 MB / 5 GB egress)
    // habis dalam hitungan minggu.
    // ---------------------------------------------------------------------
    let finalImage;
    try {
      if (selectedFile) {
        const compressed = await compressImageBlob(selectedFile);
        finalImage = await uploadUnitPhoto(compressed, 'units');
      } else {
        finalImage = DEFAULT_UNIT_IMAGE;
      }
    } catch (uploadErr) {
      console.error('Gagal mengunggah foto ke storage:', uploadErr);
      setSaveError(`Foto gagal diunggah ke storage: ${uploadErr?.message || uploadErr}. Unit belum disimpan — coba lagi atau lewati foto.`);
      setIsSaving(false);
      return;
    }

    const newUnit = {
      // ID aman (anti-tabrakan milidetik) — lihat generateUnitId() di cloudStore.
      id: generateUnitId(),
      brand,
      model,
      year: Number(year),
      plate: finalPlate,
      color,
      odometer: Number(odometer),
      engineNo: 'ENG' + Math.floor(100000 + Math.random() * 900000),
      frameNo: 'MH' + Math.floor(1000000000 + Math.random() * 9000000000),
      taxStatus,
      taxValidUntil,
      taxDeadYears: taxStatus === 'Mati Pajak' ? Number(taxDeadYears) : 0,
      documents: documents.length > 0 ? documents : ['STNK', 'BPKB'],
      condition,
      buyPrice: Number(buyPrice),
      repairCost: 0,
      minMarginPercent: Number(minMarginPercent),
      displayPrice: Number(displayPrice),
      status: status || 'Perbaikan',
      images: [finalImage],
      entryDate: new Date().toISOString().split('T')[0],
      repairs: []
    };

    try {
      const result = await onAddUnit(newUnit);

      if (result && result.ok === false) {
        // Modal sengaja TIDAK ditutup: data yang sudah diketik (termasuk foto)
        // tetap utuh supaya bisa diperbaiki lalu disimpan ulang.
        setSaveError(result.message || 'Unit gagal disimpan ke database.');
        return;
      }
      onClose();
    } catch (err) {
      console.error('Simpan unit gagal:', err);
      setSaveError(err?.message || 'Unit gagal disimpan ke database.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl my-6 transition-all">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Input Data Unit Motor Baru</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Standar input Maharga Showroom lengkap dengan nopol 3 bagian & kalkulasi margin
            </p>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Tutup modal input unit"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          
          {/* Section 1: Photo Upload Box */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <label className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Foto Unit Motor (Katalog & Detail)
            </label>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0 relative shadow-sm">
                <img 
                  src={uploadPreview || DEFAULT_UNIT_IMAGE} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                />
                <span className="absolute bottom-1 right-1 px-1 rounded bg-zinc-950/80 text-[9px] text-amber-400 font-mono">
                  Preview
                </span>
              </div>

              <div className="space-y-2 flex-1 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs border border-zinc-700 hover:border-amber-400/50 flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Unggah Foto Unit (Kamera HP / File)</span>
                </button>
                <p className="text-[10px] text-zinc-500">
                  Format JPG, PNG, atau WebP. Foto akan tersimpan di database showroom.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Unit Details & Cascading Merk/Tipe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-zinc-300 block mb-1">Merk Motor *</label>
              <select
                value={brand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-bold focus:outline-none focus:border-amber-400 transition-colors"
              >
                {brands.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Tipe / Model Motor *</label>
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  list="model-suggestions"
                  placeholder="Pilih atau ketik model..."
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <datalist id="model-suggestions">
                  {brandModels.map(m => (
                    <option key={m.id} value={m.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* 3-Box Plate Input (nopol_1, nopol_2, nopol_3) */}
            <div className="sm:col-span-2">
              <label className="font-medium text-zinc-300 block mb-1">
                Nomor Polisi (Plat) *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="AD"
                    value={nopol1}
                    onChange={(e) => setNopol1(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold text-center uppercase focus:outline-none focus:border-amber-400"
                    maxLength={3}
                  />
                  <span className="text-[9px] text-zinc-500 text-center block mt-0.5">Wilayah</span>
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="1234"
                    value={nopol2}
                    onChange={(e) => setNopol2(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold text-center focus:outline-none focus:border-amber-400"
                    maxLength={5}
                  />
                  <span className="text-[9px] text-zinc-500 text-center block mt-0.5">Nomor</span>
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="ABC"
                    value={nopol3}
                    onChange={(e) => setNopol3(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold text-center uppercase focus:outline-none focus:border-amber-400"
                    maxLength={4}
                  />
                  <span className="text-[9px] text-zinc-500 text-center block mt-0.5">Seri</span>
                </div>
              </div>
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Tahun Motor *</label>
              <input
                type="number"
                required
                value={year}
                placeholder="2023"
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 font-mono transition-colors"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Warna Bodi</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Contoh: Hitam Doff"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Kilometer (Odometer)</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(Number(e.target.value))}
                placeholder="Contoh: 15000"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 font-mono transition-colors"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Status Pajak</label>
              <select
                value={taxStatus}
                onChange={(e) => setTaxStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
              >
                <option value="Hidup">Pajak Hidup</option>
                <option value="Mati Pajak">Pajak Mati</option>
              </select>
            </div>

            {taxStatus === 'Mati Pajak' ? (
              <div>
                <label className="font-medium text-zinc-300 block mb-1">Pajak Mati (Berapa Tahun)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={taxDeadYears}
                  onChange={(e) => setTaxDeadYears(Number(e.target.value))}
                  placeholder="Contoh: 2"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-rose-400 font-bold focus:outline-none focus:border-amber-400 font-mono transition-colors"
                />
              </div>
            ) : (
              <div>
                <label className="font-medium text-zinc-300 block mb-1">Pajak Berlaku Hingga</label>
                <input
                  type="date"
                  value={taxValidUntil}
                  onChange={(e) => setTaxValidUntil(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 font-mono transition-colors"
                />
              </div>
            )}
          </div>

          {/* Section 3: Kelengkapan Dokumen */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <label className="font-medium text-zinc-300 block text-[11px]">
              Kelengkapan Dokumen Kendaraan
            </label>
            <div className="flex flex-wrap gap-2">
              {availableDocs.map((doc) => {
                const isSelected = documents.includes(doc);
                return (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => toggleDocument(doc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isSelected 
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm' 
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    <span>{doc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Kondisi Awal */}
          <div>
            <label className="font-medium text-zinc-300 block mb-1">Kondisi Awal Motor (Saat Masuk)</label>
            <textarea
              rows={2}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Catatan kondisi mesin, fisik, bodi, kelistrikan..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Section 4b: Alur Status Unit Masuk (Input Unit Masuk -> Bengkel -> Tersedia) */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <label className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> Alur Status Unit Masuk
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">Urutan: Masuk &gt; Bengkel &gt; Tersedia</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Perbaikan')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  status === 'Perbaikan'
                    ? 'bg-yellow-500/15 border-yellow-500/60 text-yellow-300 font-bold shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  <span className="text-xs">Masuk Bengkel</span>
                </div>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Servis / perbaikan / poles</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Belum Tersedia')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  status === 'Belum Tersedia'
                    ? 'bg-blue-500/15 border-blue-500/60 text-blue-300 font-bold shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span className="text-xs">Belum Tersedia</span>
                </div>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Antrean / cek dokumen</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Tersedia')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  status === 'Tersedia'
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-bold shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs">Tersedia (Ready)</span>
                </div>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Langsung siap jual</span>
              </button>
            </div>
          </div>

          {/* Section 5: Analisa Modal Internal & Kebijakan Harga Jual */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Calculator className="w-3.5 h-3.5" /> Analisa Modal & Kebijakan Harga Jual
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-medium text-zinc-400 block mb-1">Harga Beli Unit (Modal)</label>
                <input
                  type="number"
                  required
                  step="100000"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-400 block mb-1">Margin Target (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minMarginPercent}
                  onChange={(e) => setMinMarginPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-400 block mb-1">Harga Display (Iklan)</label>
                <input
                  type="number"
                  step="100000"
                  value={displayPrice}
                  onChange={(e) => setDisplayPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Calculated Minimum Sell Price Banner */}
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Harga Minimal Jual (Margin {minMarginPercent}%):</span>
              <span className="font-mono font-bold text-rose-400">{formatIDR(minPrice)}</span>
            </div>
          </div>

          {saveError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-[11px] space-y-1">
              <div className="font-bold">⚠️ Unit TIDAK tersimpan ke database</div>
              <div className="leading-relaxed break-words">{saveError}</div>
              <div className="text-rose-300/70">
                Isian form masih utuh. Perbaiki penyebabnya, lalu tekan Simpan lagi — unit yang
                gagal tidak akan muncul lagi di katalog setelah halaman di-refresh.
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan ke database…' : 'Simpan & Terbitkan Unit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
