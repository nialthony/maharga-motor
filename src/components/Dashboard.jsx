import React from 'react';
import { 
  Layers, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  CreditCard,
  Plus,
  Bike,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Settings,
  Receipt
} from 'lucide-react';
import { formatIDR, calculateUnitEconomics } from '../data/mockData';

export default function Dashboard({ 
  units = [], 
  salesList = [], 
  role, 
  setActiveTab, 
  onSelectUnit,
  onOpenPOS,
  onOpenNewUnit
}) {
  const readyUnits = units.filter(u => u.status === 'Tersedia');
  const soldUnits = salesList.filter(s => s.status === 'Lunas' || s.status === 'Terjual');
  const tempoUnits = salesList.filter(s => s.paymentMethod === 'dp-tempo' && s.status === 'Tempo Aktif');

  // Real Dynamic Calculations
  const totalOmset = salesList.reduce((acc, curr) => acc + (curr.dealPrice || 0), 0);
  const totalReceivables = tempoUnits.reduce((acc, curr) => acc + (curr.remainingAmount || 0), 0);
  
  // Gross Profit calculation from real sold units
  const totalSoldModal = salesList.reduce((acc, tx) => {
    const matchedUnit = units.find(u => u.id === tx.unitId);
    if (matchedUnit) {
      return acc + (matchedUnit.buyPrice || 0) + (matchedUnit.repairCost || 0);
    }
    return acc + Math.round(tx.dealPrice * 0.88);
  }, 0);

  const totalCommissions = salesList.reduce((acc, curr) => acc + (curr.commission || 0), 0);
  const totalGrossProfit = totalOmset > 0 ? (totalOmset - totalSoldModal) : 0;
  const deadTaxUnits = units.filter(u => u.taxStatus === 'Mati Pajak' && u.status === 'Tersedia');

  const isEmpty = units.length === 0 && salesList.length === 0;

  return (
    <div className="space-y-5 pb-20 md:pb-12">
      {/* Top Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base font-bold text-zinc-100 font-mono">
              Dashboard Operasional Showroom
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Pusat kendali stok unit motor, valuasi modal HPP, transaksi kasir, dan monitoring piutang tempo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role === 'owner' && (
            <button
              onClick={onOpenNewUnit}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              Input Motor Masuk
            </button>
          )}

          <button
            onClick={() => setActiveTab('pos')}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 border border-zinc-700 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Kasir POS
          </button>
        </div>
      </div>

      {/* Metric Cards Grid (100% Live Dynamic) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Unit Ready */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="bg-zinc-900/90 hover:bg-zinc-850 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer space-y-2 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Unit Ready (Stok)</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-zinc-100">
              {readyUnits.length}
            </span>
            <span className="text-[11px] font-semibold text-zinc-500">Unit</span>
          </div>
          <p className="text-[11px] text-zinc-500">Motor tersedia untuk dijual</p>
        </div>

        {/* Card 2: Terjual */}
        <div 
          onClick={() => setActiveTab(role === 'owner' ? 'financial_report' : 'my_commission')}
          className="bg-zinc-900/90 hover:bg-zinc-850 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer space-y-2 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Unit Terjual</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {soldUnits.length}
            </span>
            <span className="text-[11px] font-semibold text-zinc-500">Deal</span>
          </div>
          <p className="text-[11px] text-zinc-500">Total unit berhasil terjual</p>
        </div>

        {/* Card 3: Omset Penjualan / Laba */}
        <div 
          onClick={() => setActiveTab(role === 'owner' ? 'financial_report' : 'my_commission')}
          className="bg-zinc-900/90 hover:bg-zinc-850 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer space-y-2 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {role === 'owner' ? 'Total Omset Masuk' : 'Total Transaksi'}
            </span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2 truncate">
            <span className="text-xl sm:text-2xl font-black font-mono text-zinc-100 truncate">
              {formatIDR(totalOmset)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            {role === 'owner' ? `Laba Kotor: ${formatIDR(totalGrossProfit)}` : 'Akumulasi nilai penjualan'}
          </p>
        </div>

        {/* Card 4: Piutang Titip DP / Tempo */}
        <div 
          onClick={() => setActiveTab('tempo')}
          className="bg-zinc-900/90 hover:bg-zinc-850 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer space-y-2 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Piutang Titip DP/Tempo</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 truncate">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 truncate">
              {formatIDR(totalReceivables)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            {tempoUnits.length > 0 ? `${tempoUnits.length} transaksi tempo aktif` : 'Semua pembayaran lunas'}
          </p>
        </div>
      </div>

      {/* Empty State Welcome Guide (When starting fresh with 0 units) */}
      {isEmpty && (
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Siap Digunakan untuk Showroom Fisik Asli
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-zinc-100 tracking-tight">
              Mulai Input Stok Motor Pertama Showroom Anda
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Sistem telah bersih dan siap mencatat operasional showroom motor Anda secara riil. Ikuti 3 langkah cepat di bawah ini untuk memulai:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div 
              onClick={onOpenNewUnit}
              className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/60 transition-all cursor-pointer space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-sm font-mono group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
                1
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                  Input Motor Masuk
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Catat harga beli (kulak), estimasi biaya servis bengkel, harga display, dan upload foto motor langsung dari HP.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 pt-1">
                <span>+ Tambah Unit Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Step 2 */}
            <div 
              onClick={() => setActiveTab('pos')}
              className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/60 transition-all cursor-pointer space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm font-mono group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-colors">
                2
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                  Kasir POS & Titip DP
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Lakukan transaksi penjualan Cash Lunas atau Titip DP, tentukan komisi sales (100rb, 200rb, dll.), dan cetak SPK resmi.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 pt-1">
                <span>Buka Kasir Penjualan</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Step 3 */}
            <div 
              onClick={() => setActiveTab('inventory')}
              className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-blue-500/60 transition-all cursor-pointer space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm font-mono group-hover:bg-blue-500 group-hover:text-zinc-950 transition-colors">
                3
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">
                  Katalog Stok & HPP
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Pantau batas minimal harga tawar sales, status pajak kendaraan (hidup/mati), dan kelengkapan berkas STNK/BPKB.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-blue-400 pt-1">
                <span>Lihat Katalog Showroom</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tax Alert if there are dead tax units */}
      {deadTaxUnits.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Perhatian:</strong> Terdapat {deadTaxUnits.length} unit ready dengan status <strong>Pajak Mati</strong> ({deadTaxUnits.map(u => u.plate).join(', ')}).
            </span>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-2.5 py-1 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-semibold text-[11px] transition-colors"
          >
            Lihat Unit
          </button>
        </div>
      )}

      {/* Live Unit Ready Table */}
      {!isEmpty && (
        <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden shadow-sm space-y-0">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Daftar Unit Ready (Stok Terkini)</h3>
              <p className="text-[11px] text-zinc-400">Katalog motor tersedia untuk transaksi Cash & Titip DP</p>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Lihat Semua ({readyUnits.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Unit Motor</th>
                  <th className="py-3 px-4">No. Polisi</th>
                  <th className="py-3 px-4">Tahun / Warna</th>
                  <th className="py-3 px-4">Pajak</th>
                  {role === 'owner' && <th className="py-3 px-4 font-mono">Total HPP Modal</th>}
                  <th className="py-3 px-4 font-mono">Batas Min. Nego</th>
                  <th className="py-3 px-4 font-mono">Harga Display</th>
                  <th className="py-3 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {readyUnits.length > 0 ? (
                  readyUnits.slice(0, 5).map((unit) => {
                    const eco = calculateUnitEconomics(unit);
                    return (
                      <tr key={unit.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-100">{unit.brand} {unit.model}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{(unit.odometer || 0).toLocaleString('id-ID')} km</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">{unit.plate}</td>
                        <td className="py-3 px-4">{unit.year} • {unit.color}</td>
                        <td className="py-3 px-4">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            unit.taxStatus === 'Hidup' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {unit.taxStatus}
                          </span>
                        </td>
                        {role === 'owner' && (
                          <td className="py-3 px-4 font-mono font-semibold text-zinc-300">
                            {formatIDR(eco.totalModal)}
                          </td>
                        )}
                        <td className="py-3 px-4 font-mono font-semibold text-rose-400">
                          {formatIDR(eco.minPrice)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-zinc-100">
                          {formatIDR(unit.displayPrice)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onSelectUnit(unit)}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors"
                            >
                              Detail
                            </button>
                            <button
                              onClick={() => onOpenPOS(unit)}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-bold transition-colors"
                            >
                              Jual
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-zinc-500">
                      Belum ada unit stok motor dengan status "Tersedia".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
