import React, { useState, useRef } from 'react';
import { 
  X, 
  Calculator,
  Upload,
  Image as ImageIcon,
  Check,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function NewUnitModal({ isOpen, onClose, onAddUnit }) {
  const [brand, setBrand] = useState('Honda');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(2023);
  const [plate, setPlate] = useState('AD ');
  const [color, setColor] = useState('Hitam');
  const [odometer, setOdometer] = useState(12000);
  const [taxStatus, setTaxStatus] = useState('Hidup');
  const [taxValidUntil, setTaxValidUntil] = useState('2027-05-10');
  const [taxDeadYears, setTaxDeadYears] = useState(0);
  const [condition, setCondition] = useState('Bodi orisinil mulus, mesin segel pabrik, ban 85%');
  
  // Kelengkapan Dokumen (STNK, BPKB, dll)
  const [documents, setDocuments] = useState(['STNK', 'BPKB']);
  
  // Analisa Modal & Harga Jual (Tanpa Est. Servis sesuai instruksi)
  const [buyPrice, setBuyPrice] = useState(15000000);
  const [minMarginPercent, setMinMarginPercent] = useState(10);
  const [displayPrice, setDisplayPrice] = useState(17500000);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80');
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileInputRef = useRef(null);

  const totalModal = buyPrice;
  const minPrice = Math.round(totalModal * (1 + (minMarginPercent / 100)));

  // Available document options
  const availableDocs = ['STNK', 'BPKB', 'Faktur', 'Notice Pajak'];

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

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      setUploadPreview(base64Data);
      setImageUrl(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!model.trim() || !plate.trim()) return;

    const finalImage = uploadPreview || imageUrl.trim() || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80';

    const newUnit = {
      id: Date.now(),
      brand,
      model,
      year: Number(year),
      plate: plate.toUpperCase().trim(),
      color,
      odometer: Number(odometer),
      engineNo: 'ENG' + Math.floor(100000 + Math.random() * 900000),
      frameNo: 'MH' + Math.floor(1000000000 + Math.random() * 9000000000),
      taxStatus,
      taxValidUntil,
      taxDeadYears: Number(taxDeadYears),
      documents: documents.length > 0 ? documents : ['STNK', 'BPKB'],
      condition,
      buyPrice: Number(buyPrice),
      repairCost: 0,
      minMarginPercent: Number(minMarginPercent),
      displayPrice: Number(displayPrice),
      status: 'Tersedia',
      images: [finalImage],
      entryDate: new Date().toISOString().split('T')[0],
      repairs: []
    };

    onAddUnit(newUnit);
    onClose();
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
              Input Data Motor Masuk Showroom
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Langsung tersimpan dan tampil di katalog stok tanpa perlu redeploy
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
          
          {/* Section 1: Photo Upload Box (Clean, without preset clutter) */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <label className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Foto Katalog Unit
            </label>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Preview Thumbnail */}
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0 relative shadow-sm">
                <img 
                  src={uploadPreview || imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                />
                <span className="absolute bottom-1 right-1 px-1 rounded bg-zinc-950/80 text-[9px] text-amber-400 font-mono">
                  Preview
                </span>
              </div>

              {/* Upload Trigger */}
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
                  <span>Pilih File Foto dari HP / PC</span>
                </button>
                <p className="text-[10px] text-zinc-500">
                  Format gambar JPG, PNG, atau WebP. Foto akan otomatis dioptimalkan.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Unit Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-zinc-300 block mb-1">Merk Motor *</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-bold focus:outline-none focus:border-amber-400 transition-colors"
              >
                <option value="Honda">Honda</option>
                <option value="Yamaha">Yamaha</option>
                <option value="Vespa">Vespa</option>
                <option value="Kawasaki">Kawasaki</option>
                <option value="Suzuki">Suzuki</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Tipe / Model Motor *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Vario 160 CBS"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Nomor Polisi (Plat) *</label>
              <input
                type="text"
                required
                placeholder="AD 1234 XX"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-400 uppercase transition-colors"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Tahun Pembuatan *</label>
              <input
                type="number"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
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
              <label className="font-medium text-zinc-300 block mb-1">Odometer (KM)</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
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

            {taxStatus === 'Hidup' ? (
              <div>
                <label className="font-medium text-zinc-300 block mb-1">Pajak Berlaku Hingga</label>
                <input
                  type="date"
                  value={taxValidUntil}
                  onChange={(e) => setTaxValidUntil(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 font-mono transition-colors"
                />
              </div>
            ) : (
              <div>
                <label className="font-medium text-zinc-300 block mb-1">Mati Pajak (Tahun)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={taxDeadYears}
                  onChange={(e) => setTaxDeadYears(Number(e.target.value))}
                  placeholder="Jumlah tahun mati"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 font-mono transition-colors"
                />
              </div>
            )}
          </div>

          {/* Section 2.5: Pilihan Kelengkapan Dokumen (STNK, BPKB) */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Kelengkapan Dokumen Motor *
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {documents.length} Dokumen Dipilih
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {availableDocs.map((doc) => {
                const isSelected = documents.includes(doc);
                const isCore = doc === 'STNK' || doc === 'BPKB';
                return (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => toggleDocument(doc)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-1.5 transition-all ${
                      isSelected
                        ? isCore
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-sm font-bold'
                          : 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span>{doc}</span>
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                      isSelected 
                        ? isCore
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black' 
                          : 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black'
                        : 'border-zinc-700 bg-zinc-950'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-zinc-500">
              Pilih dokumen resmi yang telah diverifikasi fisik oleh pihak showroom.
            </p>
          </div>

          {/* Kondisi Singkat Unit */}
          <div>
            <label className="font-medium text-zinc-300 block mb-1">Kondisi Singkat Unit</label>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Contoh: Bodi orisinil 95%, mesin halus segel pabrik, ban baru"
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Section 3: Pricing & Economics (Tanpa Est. Servis) */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> Analisa Modal & Harga Jual
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-zinc-400 block mb-1 text-[11px] font-semibold">Harga Beli Masuk (Rp):</label>
                <input
                  type="number"
                  required
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono font-bold focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 text-[11px] font-semibold">Margin Min. Sales (%):</label>
                <input
                  type="number"
                  value={minMarginPercent}
                  onChange={(e) => setMinMarginPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono font-bold focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-amber-400 font-bold block mb-1 text-[11px]">Harga Display Iklan (Rp):</label>
                <input
                  type="number"
                  required
                  value={displayPrice}
                  onChange={(e) => setDisplayPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-amber-500/50 text-amber-400 font-mono font-black focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-850 flex justify-between items-center text-xs text-zinc-300">
              <span>Total HPP Modal: <strong className="text-zinc-100 font-mono">{formatIDR(totalModal)}</strong></span>
              <span>Batas Min. Sales: <strong className="text-rose-400 font-mono">{formatIDR(minPrice)}</strong></span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Simpan & Masukkan ke Katalog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
