import React, { useState } from 'react';
import { 
  Layers, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CreditCard,
  Plus,
  CheckCircle2, 
  History,
  X,
  User,
  ExternalLink,
  Printer
} from 'lucide-react';
import { formatIDR, calculateUnitEconomics } from '../data/mockData';

export default function Dashboard({ 
  units = [], 
  salesList = [], 
  role, 
  setActiveTab, 
  onSelectUnit, 
  onOpenPOS, 
  onOpenNewUnit,
  employees = [],
  settings = {},
  onPrintReceipt
}) {
  const [drilldownType, setDrilldownType] = useState(null); // 'ready' | 'repair' | 'sold' | 'sales'

  const readyUnits = units.filter(u => u.status === 'Tersedia');
  const tempoUnits = salesList.filter(s => s.paymentMethod === 'dp-tempo' && s.status === 'Tempo Aktif');
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  // Dynamic Calculations
  const totalOmset = salesList.reduce((acc, curr) => acc + (curr.dealPrice || 0), 0);
  const totalReceivables = tempoUnits.reduce((acc, curr) => acc + (curr.remainingAmount || 0), 0);
  
  // Perhitungan Unit Terjual Bulan Ini
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleString('id-ID', { month: 'long' });
  const soldThisMonth = salesList.filter(s => {
    if (!s.date) return false;
    return s.date.startsWith(currentYearMonth) && (s.status === 'Lunas' || s.status === 'Terjual' || s.status === 'Tempo Aktif');
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

  // Helper Format Tanggal & Jam
  const formatDateTime = (dateStr, createdAtStr) => {
    if (createdAtStr) {
      try {
        const d = new Date(createdAtStr);
        if (!isNaN(d.getTime())) {
          const dPart = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const tPart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          return `${dPart} • ${tPart} WIB`;
        }
      } catch {}
    }
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      } catch {}
      return dateStr;
    }
    return '-';
  };

  // ==============================================================
  // DATA AKTIVITAS STOK (PENJUALAN & UNIT READY TERBARU)
  // ==============================================================
  const soldActivities = salesList.map(s => {
    const matchedUnit = units.find(u => u.id === s.unitId);
    return {
      id: `sale-${s.id}`,
      type: 'sold',
      status: s.status,
      badgeText: s.status === 'Lunas' ? 'Terjual (Lunas)' : 'Terjual (Tempo DP)',
      title: s.unitName || (matchedUnit ? `${matchedUnit.brand} ${matchedUnit.model}` : 'Unit Motor'),
      plate: s.plate || matchedUnit?.plate || '-',
      date: s.date || '',
      createdAt: s.createdAt || null,
      price: s.dealPrice || 0,
      buyerName: s.buyerName || '',
      buyerPhone: s.buyerPhone || '',
      buyerAddress: s.buyerAddress || '',
      salesName: s.salesName || '',
      paymentType: s.paymentType || (s.paymentMethod === 'dp-tempo' ? 'Tempo DP' : 'Cash'),
      unit: matchedUnit,
      rawSale: s,
      sortTime: s.createdAt ? new Date(s.createdAt).getTime() : (s.date ? new Date(s.date).getTime() : 0)
    };
  });

  const readyActivities = readyUnits.map(u => {
    const eco = calculateUnitEconomics(u);
    return {
      id: `unit-${u.id}`,
      type: 'ready',
      status: u.status,
      badgeText: 'Ready Showroom',
      title: `${u.brand} ${u.model}`,
      plate: u.plate,
      date: u.createdAt ? u.createdAt.split('T')[0] : (u.taxValidUntil || ''),
      createdAt: u.createdAt || null,
      price: u.displayPrice || 0,
      minPrice: eco.minPrice,
      totalModal: eco.totalModal,
      yearColor: `${u.year} • ${u.color}`,
      taxStatus: u.taxStatus,
      odometer: u.odometer,
      unit: u,
      sortTime: typeof u.id === 'number' ? u.id : 0
    };
  });

  // 10 Aktivitas Terakhir Stok (Kombinasi Terbaru Masuk & Terjual)
  const combinedActivities = [...soldActivities, ...readyActivities];
  combinedActivities.sort((a, b) => (b.sortTime || 0) - (a.sortTime || 0));
  const displayedActivities = combinedActivities.slice(0, 10);

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

      {/* Metric Cards Grid - Matching Live System Drilldown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Unit Ready (Stok) */}
        <div 
          onClick={() => setDrilldownType('ready')}
          className="p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer space-y-2 shadow-sm bg-zinc-900/90 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Unit Siap Jual (Ready)</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-zinc-100">
              {readyUnits.length}
            </span>
            <span className="text-[11px] font-semibold text-zinc-500">Unit</span>
          </div>
          <p className="text-[11px] text-amber-400 font-medium">Klik untuk rincian data</p>
        </div>

        {/* Card 2: Di Workshop (Perbaikan) */}
        <div 
          onClick={() => setDrilldownType('repair')}
          className="p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer space-y-2 shadow-sm bg-zinc-900/90 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Di Workshop (Perbaikan)</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-yellow-400">
              {units.filter(u => u.status === 'Perbaikan' || (u.repairs && u.repairs.length > 0 && u.status !== 'Terjual')).length}
            </span>
            <span className="text-[11px] font-semibold text-zinc-500">Unit</span>
          </div>
          <p className="text-[11px] text-yellow-400/80 font-medium">Klik untuk rincian data</p>
        </div>

        {/* Card 3: Terjual Bulan Ini */}
        <div 
          onClick={() => setDrilldownType('sold')}
          className="p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer space-y-2 shadow-sm bg-zinc-900/90 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Penjualan Bulan Ini</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {soldThisMonth.length}
            </span>
            <span className="text-[11px] font-semibold text-zinc-500">Unit ({currentMonthName})</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-medium">Klik untuk rincian data</p>
        </div>

        {/* Card 4: Tim Sales Aktif */}
        <div 
          onClick={() => setDrilldownType('sales')}
          className="bg-zinc-900/90 hover:bg-zinc-850 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer space-y-2 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Tim Sales Aktif</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-zinc-100">
              {employees.filter(e => e.role === 'sales' && e.status === 'active').length || 1}
            </span>
            <span className="text-[11px] font-semibold text-zinc-500">Sales</span>
          </div>
          <p className="text-[11px] text-blue-400 font-medium">Klik untuk rincian data</p>
        </div>
      </div>

      {/* Showroom License Status Widget (Matching Live System) */}
      <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-zinc-300">
            Status Lisensi: <strong className="text-emerald-400 font-bold">{settings?.license_status || 'TERVERIFIKASI EXTEND'}</strong>
          </span>
        </div>
        <div className="text-zinc-500 font-mono text-[11px]">
          Berlaku Hingga: <strong className="text-amber-400 font-bold">{settings?.license_expired || '19 March 2027'}</strong>
        </div>
      </div>

      {/* Dead Tax Warning Alert Banner */}
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

      {/* ============================================================== */}
      {/* SECTION: AKTIVITAS TERAKHIR STOK (HANYA AKTIVITAS TERAKHIR)    */}
      {/* ============================================================== */}
      {!isEmpty && (
        <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden shadow-sm space-y-0">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-zinc-100">Aktivitas Terakhir Stok</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {displayedActivities.length} Aktivitas
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Catatan riwayat pergerakan stok unit motor terbaru (Masuk & Terjual)
              </p>
            </div>
          </div>

          {/* Desktop Table for Activities */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Status & Waktu</th>
                  <th className="py-3 px-4">Unit Motor</th>
                  <th className="py-3 px-4">No. Polisi</th>
                  <th className="py-3 px-4">Keterangan / Pelaku</th>
                  <th className="py-3 px-4 font-mono text-right">Nominal (Harga)</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {displayedActivities.length > 0 ? (
                  displayedActivities.map((act) => {
                    const isSold = act.type === 'sold';
                    return (
                      <tr key={act.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {isSold ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {act.badgeText}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 inline-flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {act.badgeText}
                              </span>
                            )}
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {act.date || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-100">{act.title}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {isSold ? `Metode: ${act.paymentType}` : `${act.yearColor || ''} • ${act.odometer ? `${act.odometer.toLocaleString('id-ID')} km` : ''}`}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          {act.plate}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {isSold ? (
                            <div>
                              <div>Pembeli: <strong className="text-zinc-200">{act.buyerName || '-'}</strong></div>
                              <div className="text-[10px] text-zinc-500">Sales: {act.salesName || '-'}</div>
                            </div>
                          ) : (
                            <div>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                act.taxStatus === 'Hidup' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}>
                                Pajak {act.taxStatus || 'Hidup'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-right">
                          {isSold ? (
                            <div>
                              <div className="font-bold text-emerald-400">{formatIDR(act.price)}</div>
                              <div className="text-[10px] text-zinc-500">Deal Selesai</div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-bold text-zinc-100">{formatIDR(act.price)}</div>
                              <div className="text-[10px] text-rose-400 font-mono">Min: {formatIDR(act.minPrice || 0)}</div>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {act.unit && (
                              <button
                                onClick={() => onSelectUnit(act.unit)}
                                aria-label={`Lihat detail ${act.title}`}
                                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors min-h-[30px]"
                              >
                                Detail
                              </button>
                            )}
                            {isSold && (
                              <button
                                onClick={() => onPrintReceipt && onPrintReceipt(act.rawSale || act)}
                                aria-label={`Cetak kwitansi ${act.title}`}
                                className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-bold transition-colors min-h-[30px] flex items-center gap-1 shadow-sm"
                                title="Cetak Kwitansi / Nota PDF"
                              >
                                <Printer className="w-3 h-3 text-rose-400" />
                                <span>Kwitansi</span>
                              </button>
                            )}
                            {!isSold && isOwnerOrAdmin && act.unit && (
                              <button
                                onClick={() => onOpenPOS(act.unit)}
                                aria-label={`Jual unit ${act.title}`}
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
                    <td colSpan={6} className="text-center py-8 text-zinc-500">
                      Tidak ada aktivitas stok pada kategori ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards for Activities */}
          <div className="md:hidden divide-y divide-zinc-800">
            {displayedActivities.length > 0 ? (
              displayedActivities.map((act) => {
                const isSold = act.type === 'sold';
                return (
                  <div key={act.id} className="p-3.5 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {isSold ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {act.badgeText}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 inline-flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {act.badgeText}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-500 font-mono">{act.date || '-'}</span>
                        </div>
                        <h4 className="font-bold text-zinc-100 text-sm">{act.title}</h4>
                        <div className="font-mono text-amber-400 font-bold text-xs">{act.plate}</div>
                      </div>

                      <div className="text-right">
                        <div className={`font-mono font-bold text-sm ${isSold ? 'text-emerald-400' : 'text-zinc-100'}`}>
                          {formatIDR(act.price)}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {isSold ? act.paymentType : (act.minPrice ? `Nego: ${formatIDR(act.minPrice)}` : 'Display')}
                        </div>
                      </div>
                    </div>

                    {isSold ? (
                      <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-300 flex items-center justify-between">
                        <span>Pembeli: <strong>{act.buyerName || '-'}</strong></span>
                        <span className="text-zinc-400">Sales: {act.salesName || '-'}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[11px] text-zinc-400 border-t border-zinc-800/60 pt-1.5">
                        <span>{act.yearColor || ''}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          act.taxStatus === 'Hidup' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          Pajak {act.taxStatus || 'Hidup'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {act.unit && (
                        <button
                          onClick={() => onSelectUnit(act.unit)}
                          aria-label={`Detail unit ${act.title}`}
                          className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors min-h-[42px]"
                        >
                          Detail Unit
                        </button>
                      )}
                      {isSold && (
                        <button
                          onClick={() => onPrintReceipt && onPrintReceipt(act.rawSale || act)}
                          aria-label={`Cetak kwitansi ${act.title}`}
                          className="flex-1 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 font-bold text-xs transition-colors min-h-[42px] flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5 text-rose-400" />
                          <span>Cetak Kwitansi</span>
                        </button>
                      )}
                      {!isSold && isOwnerOrAdmin && act.unit && (
                        <button
                          onClick={() => onOpenPOS(act.unit)}
                          aria-label={`Jual unit ${act.title}`}
                          className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors min-h-[42px]"
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
                Tidak ada aktivitas stok pada kategori ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pop-up Drilldown Modal: Matching Live System modalDash */}
      {drilldownType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl my-8 animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  {drilldownType === 'ready' && <Layers className="w-5 h-5 text-amber-400" />}
                  {drilldownType === 'repair' && <Clock className="w-5 h-5 text-yellow-400" />}
                  {drilldownType === 'sold' && <TrendingUp className="w-5 h-5 text-emerald-400" />}
                  {drilldownType === 'sales' && <User className="w-5 h-5 text-blue-400" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <span>
                      {drilldownType === 'ready' && 'Unit Siap Jual (Ready)'}
                      {drilldownType === 'repair' && 'Daftar Motor Di Workshop (Perbaikan)'}
                      {drilldownType === 'sold' && 'Penjualan Bulan Ini'}
                      {drilldownType === 'sales' && 'Daftar Tim Sales Aktif'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {drilldownType === 'ready' && `${readyUnits.length} Unit`}
                      {drilldownType === 'repair' && `${units.filter(u => u.status === 'Perbaikan' || (u.repairs && u.repairs.length > 0 && u.status !== 'Terjual')).length} Unit`}
                      {drilldownType === 'sold' && `${soldThisMonth.length} Unit`}
                      {drilldownType === 'sales' && `${employees.filter(e => e.role === 'sales' && e.status === 'active').length} Sales`}
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {drilldownType === 'ready' && 'Daftar seluruh unit motor siap tampil dan siap dipasarkan ke konsumen.'}
                    {drilldownType === 'repair' && 'Daftar unit yang sedang dalam antrean atau proses perbaikan/restorasi di workshop.'}
                    {drilldownType === 'sold' && `Rincian unit lunas dan titip DP tempo periode ${currentMonthName} ${now.getFullYear()}.`}
                    {drilldownType === 'sales' && 'Daftar anggota tim sales aktif showroom beserta performa & kontak.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrilldownType(null)}
                aria-label="Tutup detail modal"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 max-h-[75vh] overflow-y-auto">
              {/* Type: READY */}
              {drilldownType === 'ready' && (
                <div className="space-y-2">
                  {readyUnits.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-zinc-300">
                        <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                          <tr>
                            <th className="py-2.5 px-3">No. Polisi</th>
                            <th className="py-2.5 px-3">Merk & Tipe Motor</th>
                            <th className="py-2.5 px-3">Tahun / Warna</th>
                            <th className="py-2.5 px-3">Pajak</th>
                            <th className="py-2.5 px-3 text-right">Harga Display</th>
                            <th className="py-2.5 px-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 font-medium">
                          {readyUnits.map((u) => (
                            <tr key={u.id} className="hover:bg-zinc-850/50 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{u.plate}</td>
                              <td className="py-2.5 px-3 font-semibold text-zinc-100">{u.brand} {u.model}</td>
                              <td className="py-2.5 px-3 text-zinc-400">{u.year} • {u.color}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  u.taxStatus === 'Hidup' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                                }`}>
                                  {u.taxStatus || 'Hidup'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-100">
                                {formatIDR(u.displayPrice || 0)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setDrilldownType(null);
                                      onSelectUnit(u);
                                    }}
                                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors"
                                  >
                                    Detail
                                  </button>
                                  {isOwnerOrAdmin && (
                                    <button
                                      onClick={() => {
                                        setDrilldownType(null);
                                        onOpenPOS(u);
                                      }}
                                      className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-bold transition-colors"
                                    >
                                      Jual
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-zinc-500">
                      Tidak ada stok unit yang berstatus Ready (Siap Jual).
                    </div>
                  )}
                </div>
              )}

              {/* Type: REPAIR (Di Workshop) */}
              {drilldownType === 'repair' && (
                <div className="space-y-2">
                  {(() => {
                    const repairUnits = units.filter(u => u.status === 'Perbaikan' || (u.repairs && u.repairs.length > 0 && u.status !== 'Terjual'));
                    if (repairUnits.length === 0) {
                      return (
                        <div className="text-center py-10 text-zinc-500">
                          Tidak ada unit yang sedang dalam pengerjaan di workshop saat ini.
                        </div>
                      );
                    }
                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-300">
                          <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                            <tr>
                              <th className="py-2.5 px-3">No. Polisi</th>
                              <th className="py-2.5 px-3">Motor</th>
                              <th className="py-2.5 px-3">Status / Mekanik</th>
                              <th className="py-2.5 px-3">Item Tindakan</th>
                              <th className="py-2.5 px-3 text-right">Total Biaya</th>
                              <th className="py-2.5 px-3 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60 font-medium">
                            {repairUnits.map((u) => {
                              const repList = u.repairs || [];
                              const lastRep = repList[repList.length - 1];
                              const totalCost = repList.reduce((acc, r) => acc + (r.cost || 0), 0) || u.repairCost || 0;
                              return (
                                <tr key={u.id} className="hover:bg-zinc-850/50 transition-colors">
                                  <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{u.plate}</td>
                                  <td className="py-2.5 px-3 font-semibold text-zinc-100">{u.brand} {u.model}</td>
                                  <td className="py-2.5 px-3 text-zinc-300">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950 text-yellow-400 border border-yellow-800">
                                      {lastRep?.mechanic || 'Workshop Bengkel'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-400 max-w-[200px] truncate">
                                    {repList.length > 0 ? repList.map(r => r.item || r.description).join(', ') : (u.notes || 'Perbaikan standar')}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-yellow-400">
                                    {formatIDR(totalCost)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      onClick={() => {
                                        setDrilldownType(null);
                                        onSelectUnit(u);
                                      }}
                                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors"
                                    >
                                      Detail
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Type: SOLD */}
              {drilldownType === 'sold' && (
                <div className="space-y-3">
                  {soldThisMonth.length > 0 ? (
                    soldThisMonth.map((s) => {
                      const matchedUnit = units.find(u => u.id === s.unitId);
                      const unitTitle = s.unitName || (matchedUnit ? `${matchedUnit.brand} ${matchedUnit.model}` : 'Unit Motor');
                      const plateNo = s.plate || matchedUnit?.plate || '-';
                      const isTempo = s.paymentMethod === 'dp-tempo' || s.paymentType === 'Tempo DP';

                      return (
                        <div 
                          key={s.id} 
                          className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2.5 text-xs shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-zinc-800/60 pb-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono font-bold text-xs border border-zinc-700">
                                  {plateNo}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isTempo 
                                    ? 'bg-amber-950 text-amber-400 border border-amber-800' 
                                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                }`}>
                                  {isTempo ? 'Titip DP / Tempo' : 'Cash Lunas'}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-zinc-100">{unitTitle}</h4>
                              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-mono">
                                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Waktu: <strong className="text-zinc-200">{formatDateTime(s.date, s.createdAt)}</strong></span>
                              </div>
                            </div>

                            <div className="sm:text-right">
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Harga Deal:</span>
                              <span className="font-mono font-black text-emerald-400 text-base">
                                {formatIDR(s.dealPrice)}
                              </span>
                              {isTempo && (
                                <div className="text-[10px] text-amber-400 font-mono font-semibold">
                                  Sisa Tempo: {formatIDR(s.remainingPayment || s.remainingAmount || 0)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                            <div>
                              <span>Pembeli: </span>
                              <strong className="text-zinc-200">{s.buyerName || '-'}</strong>
                              {s.buyerPhone && (
                                <a 
                                  href={`https://wa.me/${s.buyerPhone.replace(/[^0-9]/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="ml-2 text-amber-400 hover:underline inline-flex items-center gap-1 font-mono"
                                >
                                  <span>{s.buyerPhone}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                            <div className="sm:text-right">
                              <span>Sales: </span>
                              <strong className="text-zinc-200">{s.salesName || '-'}</strong>
                            </div>
                          </div>

                          {/* Action Footer: Cetak Kwitansi & Detail Unit */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/60">
                            {matchedUnit && (
                              <button
                                onClick={() => {
                                  setDrilldownType(null);
                                  onSelectUnit(matchedUnit);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                              >
                                Detail Unit
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setDrilldownType(null);
                                if (onPrintReceipt) onPrintReceipt(s);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5 text-rose-400" />
                              <span>Cetak Kwitansi (PDF)</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-zinc-500">
                      Belum ada penjualan tercatat untuk bulan {currentMonthName} {now.getFullYear()}.
                    </div>
                  )}
                </div>
              )}

              {/* Type: SALES */}
              {drilldownType === 'sales' && (
                <div className="space-y-2">
                  {(() => {
                    const salesTeam = employees.filter(e => e.role === 'sales' && e.status === 'active');
                    if (salesTeam.length === 0) {
                      return (
                        <div className="text-center py-10 text-zinc-500">
                          Belum ada anggota tim sales yang terdaftar atau aktif.
                        </div>
                      );
                    }
                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-300">
                          <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                            <tr>
                              <th className="py-2.5 px-3">Nama Lengkap</th>
                              <th className="py-2.5 px-3">Username / NIK</th>
                              <th className="py-2.5 px-3">Target Bulanan</th>
                              <th className="py-2.5 px-3">No. WhatsApp / HP</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60 font-medium">
                            {salesTeam.map((emp) => (
                              <tr key={emp.id} className="hover:bg-zinc-850/50 transition-colors">
                                <td className="py-2.5 px-3 font-bold text-zinc-100">{emp.name}</td>
                                <td className="py-2.5 px-3 font-mono text-zinc-400">
                                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                    {emp.username || emp.nik || '-'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono font-semibold text-amber-400">
                                  {emp.targetSales ? `${emp.targetSales} Unit / Bulan` : '-'}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-zinc-300">
                                  {emp.phone ? (
                                    <a 
                                      href={`https://wa.me/${emp.phone.replace(/[^0-9]/g, '')}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-amber-400 hover:underline inline-flex items-center gap-1"
                                    >
                                      <span>{emp.phone}</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : '-'}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                    Aktif
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end">
              <button
                onClick={() => setDrilldownType(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
