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
  ArrowRight
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
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  // Dynamic Calculations
  const totalOmset = salesList.reduce((acc, curr) => acc + (curr.dealPrice || 0), 0);
  const totalReceivables = tempoUnits.reduce((acc, curr) => acc + (curr.remainingAmount || 0), 0);
  
  // Perhitungan Unit Terjual Bulan Ini
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleString('id-ID', { month: 'long' });
  const soldThisMonth = soldUnits.filter(s => {
    if (!s.date) return false;
    return s.date.startsWith(currentYearMonth);
  });

  // Gross Profit calculation from real sold units
  const totalSoldModal = salesList.reduce((acc, tx) => {
    const matchedUnit = units.find(u => u.id === tx.unitId);
    if (matchedUnit) {
      return acc + (matchedUnit.buyPrice || 0) + (matchedUnit.repairCost || 0);
    }
    return acc + Math.round(tx.dealPrice * 0.88);
  }, 0);

  const totalGrossProfit = totalOmset > 0 ? (totalOmset - totalSoldModal) : 0;
  const deadTaxUnits = units.filter(u => u.taxStatus === 'Mati Pajak' && u.status === 'Tersedia');

  const isEmpty = units.length === 0 && salesList.length === 0;

  return (
    <div className="space-y-5 pb-20 md:pb-12 animate-fadeIn">
      {/* Top Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 shadow-sm transition-all">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base font-bold text-zinc-100 font-mono">
              Dashboard Operasional Showroom
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
              Live
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Pusat kendali stok unit motor, valuasi modal HPP, transaksi kasir, dan monitoring piutang tempo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOwnerOrAdmin && (
            <button
              onClick={onOpenNewUnit}
              aria-label="Input unit motor baru ke showroom"
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              Input Motor Masuk
            </button>
          )}

          {isOwnerOrAdmin && (
            <button
              onClick={() => setActiveTab('pos')}
              aria-label="Buka kasir transaksi penjualan"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 border border-zinc-700 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Kasir POS
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Unit Ready */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="bg-zinc-900/90 hover:bg-zinc-850 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer space-y-2 shadow-sm"
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

        {/* Card 2: Terjual Bulan Ini */}
        <div 
          onClick={() => setActiveTab(isOwnerOrAdmin ? 'financial_report' : 'my_commission')}
          className="bg-zinc-900/90 hover:bg-zinc-850 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer space-y-2 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Terjual Bulan Ini</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {soldThisMonth.length}
            </span>
            <span className="text-[11px] font-semibold text-zinc-500">Unit ({currentMonthName})</span>
          </div>
          <p className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Bulan {currentMonthName}</span>
            <span className="font-mono text-zinc-500">Total: {soldUnits.length}</span>
          </p>
        </div>

        {/* Card 3: Omset Penjualan / Laba */}
        <div 
          onClick={() => setActiveTab(role === 'owner' ? 'financial_report' : 'my_commission')}
          className="bg-zinc-900/90 hover:bg-zinc-850 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer space-y-2 shadow-sm"
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
          className="bg-zinc-900/90 hover:bg-zinc-850 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer space-y-2 shadow-sm"
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

      {/* Showroom Setup & Onboarding Guide (When starting fresh with 0 units) */}
      {isEmpty && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Stok Showroom Belum Terisi
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Mulai operasional harian showroom dengan mencatat motor masuk pertama Anda.
              </p>
            </div>
            {role === 'owner' && (
              <button
                onClick={onOpenNewUnit}
                aria-label="Input unit motor masuk pertama"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto min-h-[40px]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Input Motor Masuk Pertama
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div 
              onClick={onOpenNewUnit}
              className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 cursor-pointer space-y-1.5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">1. Pendataan Motor</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-zinc-400">
                Catat harga kulak beli, nopol, kelengkapan surat STNK/BPKB, dan foto unit.
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('pos')}
              className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer space-y-1.5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">2. Transaksi Kasir POS</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-zinc-400">
                Penjualan cash tunai, transfer, atau titip DP tempo beserta cetak SPK & kwitansi.
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('inventory')}
              className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-blue-500/50 cursor-pointer space-y-1.5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">3. Kontrol Modal HPP</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-[11px] text-zinc-400">
                Pantau batas minimal nego staf sales agar margin keuntungan showroom terjaga.
              </p>
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
            aria-label="Lihat unit pajak mati di katalog"
            className="px-2.5 py-1 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-semibold text-[11px] transition-colors min-h-[30px]"
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
              aria-label="Buka seluruh stok di katalog"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Lihat Semua ({readyUnits.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
                              aria-label={`Lihat detail ${unit.brand} ${unit.model}`}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors min-h-[30px]"
                            >
                              Detail
                            </button>
                            {isOwnerOrAdmin && (
                              <button
                                onClick={() => onOpenPOS(unit)}
                                aria-label={`Jual unit ${unit.brand} ${unit.model}`}
                                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-bold transition-colors min-h-[30px]"
                              >
                                Jual
                              </button>
                            )}
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

          {/* Mobile Cards for Unit Ready */}
          <div className="md:hidden divide-y divide-zinc-800">
            {readyUnits.length > 0 ? (
              readyUnits.slice(0, 5).map((unit) => {
                const eco = calculateUnitEconomics(unit);
                return (
                  <div key={unit.id} className="p-3.5 space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-zinc-100">{unit.brand} {unit.model}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-amber-400 font-bold text-[11px]">{unit.plate}</span>
                          <span className="text-zinc-500 text-[10px]">{unit.year} • {unit.color}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {formatIDR(unit.displayPrice)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-zinc-400 border-t border-zinc-800/60 pt-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        unit.taxStatus === 'Hidup' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        Pajak {unit.taxStatus}
                      </span>
                      <span className="text-zinc-400 font-mono">Batas Nego: <strong className="text-rose-400">{formatIDR(eco.minPrice)}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onSelectUnit(unit)}
                        aria-label={`Detail unit ${unit.brand} ${unit.model}`}
                        className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors min-h-[44px]"
                      >
                        Detail Unit
                      </button>
                      {isOwnerOrAdmin && (
                        <button
                          onClick={() => onOpenPOS(unit)}
                          aria-label={`Jual unit ${unit.brand} ${unit.model}`}
                          className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors min-h-[44px]"
                        >
                          Jual Sekarang
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-zinc-500 text-xs">
                Belum ada unit stok motor dengan status "Tersedia".
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
