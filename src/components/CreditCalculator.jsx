import React, { useState } from 'react';
import { 
  Calculator, 
  Bike, 
  Copy, 
  Check, 
  Share2, 
  DollarSign, 
  Sparkles,
  Percent
} from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function CreditCalculator({ units }) {
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id || 1422);
  const selectedUnit = units.find(u => u.id === Number(selectedUnitId)) || units[0];

  const [customPrice, setCustomPrice] = useState(selectedUnit ? selectedUnit.displayPrice : 18000000);
  const [dpPercent, setDpPercent] = useState(25); // 25%
  const [interestRateYearly, setInterestRateYearly] = useState(16); // 16% per year flat
  const [copied, setCopied] = useState(false);

  // Calculate
  const dpAmount = Math.round((customPrice * dpPercent) / 100);
  const loanPrincipal = customPrice - dpAmount;

  const calculateInstallment = (tenorMonths) => {
    const years = tenorMonths / 12;
    const totalInterest = loanPrincipal * (interestRateYearly / 100) * years;
    const totalLoan = loanPrincipal + totalInterest;
    return Math.round(totalLoan / tenorMonths);
  };

  const tenors = [11, 17, 23, 29, 35];

  const simulationSummary = `
*SIMULASI KREDIT & ANGSURAN - MAHARGA MOTOR* 🏍️

Unit: *${selectedUnit ? `${selectedUnit.brand} ${selectedUnit.model} (${selectedUnit.year})` : 'Motor Pilihan'}*
Harga Display: *${formatIDR(customPrice)}*
Uang Muka (DP ${dpPercent}%): *${formatIDR(dpAmount)}*

📊 *Pilihan Tenor & Estimasi Cicilan / Bulan:*
${tenors.map(t => `• *Tenor ${t} Bulan:* ${formatIDR(calculateInstallment(t))} / bln`).join('\n')}

*Syarat Pengajuan Mudah:*
1. KTP Suami Istri / Penjamin
2. Kartu Keluarga (KK)
3. Rekening Listrik / PBB
4. Slip Gaji / Bukti Usaha

📍 *Lokasi Showroom Maharga Motor*
Bisa langsung dibantu proses leasing resmi (FIF / Adira / OTO / BAF).
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(simulationSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Calculator className="w-7 h-7 text-amber-400" />
            Kalkulator Simulasi Kredit & Angsuran Cepat
          </h2>
          <p className="text-slate-400 text-xs">
            Hitung simulasi cicilan motor instan dan salin format rapi ke WhatsApp saat calon pembeli bertanya.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Parameters */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bike className="w-4 h-4 text-amber-400" />
              Pilih Unit / Input Harga
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Pilih dari Stok Ready:</label>
              <select
                value={selectedUnitId}
                onChange={(e) => {
                  setSelectedUnitId(e.target.value);
                  const u = units.find(unit => unit.id === Number(e.target.value));
                  if (u) setCustomPrice(u.displayPrice);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold focus:outline-none focus:border-amber-400"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.brand} {u.model} - {formatIDR(u.displayPrice)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Harga OTR / Display (Rp):</label>
              <input
                type="text"
                value={new Intl.NumberFormat('id-ID').format(customPrice)}
                onChange={(e) => setCustomPrice(Number(e.target.value.replace(/[^0-9]/g, '')))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-mono font-black text-base focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Persentase DP:</span>
                <span className="text-amber-400 font-bold">{dpPercent}% ({formatIDR(dpAmount)})</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={dpPercent}
                onChange={(e) => setDpPercent(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>10% (DP Ringan)</span>
                <span>30% (Rekomendasi)</span>
                <span>60%</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Estimasi Bunga Flat / Tahun (%):</label>
              <input
                type="number"
                value={interestRateYearly}
                onChange={(e) => setInterestRateYearly(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Results & Tenor Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Tabel Estimasi Angsuran Bulanan</h3>
                <p className="text-xs text-slate-400">
                  Pokok Pembiayaan Leasing: <strong className="text-emerald-400 font-mono">{formatIDR(loanPrincipal)}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    copied ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin!' : 'Salin Teks'}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(simulationSummary)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Kirim ke WA Konsumen
                </a>
              </div>
            </div>

            {/* Tenor Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {tenors.map((t) => {
                const installment = calculateInstallment(t);
                return (
                  <div
                    key={t}
                    className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1 hover:border-amber-400/50 transition-colors"
                  >
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                      Tenor {t} Bulan
                    </span>
                    <h4 className="text-xl font-black text-white font-mono">
                      {formatIDR(installment)}
                    </h4>
                    <span className="text-[10px] text-slate-400 block">per bulan (flat)</span>
                  </div>
                );
              })}
            </div>

            {/* Preview Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
              {simulationSummary}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
