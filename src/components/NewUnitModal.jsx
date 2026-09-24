import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Calculator,
  Upload,
  Image as ImageIcon,
  Link2,
  Check
} from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function NewUnitModal({ isOpen, onClose, onAddUnit }) {
  if (!isOpen) return null;

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
  const [buyPrice, setBuyPrice] = useState(15000000);
  const [repairCost, setRepairCost] = useState(300000);
  const [minMarginPercent, setMinMarginPercent] = useState(10);
  const [displayPrice, setDisplayPrice] = useState(17500000);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80');
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileInputRef = useRef(null);

  const totalModal = buyPrice + repairCost;
  const minPrice = Math.round(totalModal * (1 + (minMarginPercent / 100)));

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

  const presetPhotos = [
    { label: 'Vario / Aerox', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80' },
    { label: 'NMAX / PCX', url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80' },
    { label: 'Scoopy / Fazzio', url: 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?auto=format&fit=crop&w=800&q=80' },
    { label: 'Trail / Sport', url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80' }
  ];

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
      documents: ['STNK', 'BPKB', 'Faktur'],
      condition,
      buyPrice: Number(buyPrice),
      repairCost: Number(repairCost),
      minMarginPercent: Number(minMarginPercent),
      displayPrice: Number(displayPrice),
      status: 'Tersedia',
      images: [finalImage],
      entryDate: new Date().toISOString().split('T')[0],
      repairs: repairCost > 0 ? [
        { id: 1, date: new Date().toISOString().split('T')[0], item: 'QC & Service Ringan Unit Masuk', mechanic: 'Budi Santoso', cost: Number(repairCost) }
      ] : []
    };

    onAddUnit(newUnit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl my-6">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Input Data Motor Masuk & Foto</h3>
            <p className="text-[11px] text-zinc-400">Langsung tampil di katalog showroom tanpa perlu redeploy</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 max-h-[78vh] overflow-y-auto text-xs">
          
          {/* Section 1: Photo Upload Box */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <label className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Foto Katalog Unit
            </label>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Preview Thumbnail */}
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0 relative">
                <img 
                  src={uploadPreview || imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                />
                <span className="absolute bottom-1 right-1 px-1 rounded bg-zinc-950/80 text-[9px] text-amber-400 font-mono">
                  Preview
                </span>
              </div>

              {/* Upload Trigger & Presets */}
              <div className="space-y-2 flex-1 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Pilih File Foto dari HP / PC
                  </button>
                </div>

                {/* Preset Fast Picks */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-zinc-500">Preset:</span>
                  {presetPhotos.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImageUrl(preset.url);
                        setUploadPreview(null);
                      }}
                      className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
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
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-bold focus:outline-none focus:border-amber-400"
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
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
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
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-400 uppercase"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Tahun Pembuatan *</label>
              <input
                type="number"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Warna</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Odometer (KM)</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Status Pajak</label>
              <select
                value={taxStatus}
                onChange={(e) => setTaxStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
              >
                <option value="Hidup">Pajak Hidup</option>
                <option value="Mati Pajak">Pajak Mati</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-zinc-300 block mb-1">Kondisi Singkat</label>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Section 3: Pricing & Economics */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" /> Analisa Modal & Harga Jual
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-zinc-500 block mb-0.5 text-[11px]">Harga Beli (Rp):</label>
                <input
                  type="number"
                  required
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-zinc-500 block mb-0.5 text-[11px]">Est. Servis (Rp):</label>
                <input
                  type="number"
                  value={repairCost}
                  onChange={(e) => setRepairCost(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-rose-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-zinc-500 block mb-0.5 text-[11px]">Margin Min (%):</label>
                <input
                  type="number"
                  value={minMarginPercent}
                  onChange={(e) => setMinMarginPercent(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-amber-400 font-bold block mb-0.5 text-[11px]">Harga Display (Rp):</label>
                <input
                  type="number"
                  required
                  value={displayPrice}
                  onChange={(e) => setDisplayPrice(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded bg-zinc-900 border border-amber-500/50 text-amber-400 font-mono font-black"
                />
              </div>
            </div>

            <div className="p-2 rounded bg-zinc-900 flex justify-between items-center text-[11px] text-zinc-300">
              <span>Total HPP: <strong className="text-zinc-100 font-mono">{formatIDR(totalModal)}</strong></span>
              <span>Batas Min. Sales: <strong className="text-rose-400 font-mono">{formatIDR(minPrice)}</strong></span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-sm flex items-center gap-1.5"
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
