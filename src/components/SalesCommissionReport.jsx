import React, { useState } from 'react';
import { 
  BarChart3, 
  Wallet, 
  Bike, 
  Calendar,
  Download,
  DollarSign
} from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function SalesCommissionReport({ salesList, currentUser }) {
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-30');

  // Filter ONLY transactions belonging to this logged in sales user
  const mySales = salesList.filter(s => {
    const isMine = s.salesId === currentUser.id || s.salesName.toLowerCase().includes(currentUser.name.toLowerCase());
    const inDateRange = (!startDate || s.date >= startDate) && (!endDate || s.date <= endDate);
    return isMine && inDateRange;
  });

  const totalUnitSold = mySales.length;
  const totalOmset = mySales.reduce((acc, curr) => acc + (curr.dealPrice || 0), 0);
  const totalCommission = mySales.reduce((acc, curr) => acc + (curr.commission || 0), 0);
  const commissionRate = totalUnitSold > 0 ? Math.round(totalCommission / totalUnitSold) : 350000;

  return (
    <div className="space-y-4 pb-20 md:pb-12">
      {/* Header & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 p-3.5 sm:p-4 rounded-xl border border-zinc-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-zinc-100">
              Laporan Komisi Saya
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Komisi: {formatIDR(commissionRate)} / Unit
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Akun Sales: <strong>{currentUser.name}</strong> • Rekapitulasi perolehan komisi penjualan
          </p>
        </div>

        {/* Date Filter & Print */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent px-1.5 py-0.5 text-zinc-200 focus:outline-none font-mono text-[11px] sm:text-xs"
            />
            <span className="text-zinc-600 px-0.5">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent px-1.5 py-0.5 text-zinc-200 focus:outline-none font-mono text-[11px] sm:text-xs"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1 transition-colors shrink-0"
            title="Cetak Laporan"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards (Matching mahargamotor.com structure) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Box 1: UNIT TERJUAL */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 border-l-4 border-l-amber-500 space-y-1">
          <small className="text-zinc-400 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">UNIT TERJUAL</small>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl sm:text-3xl font-black font-mono text-zinc-100">{totalUnitSold}</h3>
            <span className="text-[11px] text-zinc-400">Unit</span>
          </div>
          <p className="text-[10px] text-zinc-500 hidden sm:block">Total unit terverifikasi deal</p>
        </div>

        {/* Box 2: ESTIMASI KOMISI CAIR */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 border-l-4 border-l-emerald-500 space-y-1">
          <div className="flex items-center justify-between">
            <small className="text-emerald-300 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">ESTIMASI KOMISI CAIR</small>
            <Wallet className="w-3.5 h-3.5 text-emerald-400 hidden sm:block" />
          </div>
          <h3 className="text-xl sm:text-3xl font-black font-mono text-emerald-400 truncate">
            {formatIDR(totalCommission)}
          </h3>
          <p className="text-[10px] text-emerald-300/80 hidden sm:block">Siap dicairkan pada periode ini</p>
        </div>
      </div>

      {/* Rincian Penjualan (Desktop Table + Mobile Cards) */}
      <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-3 sm:p-3.5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Rincian Penjualan Unit</h3>
          <span className="text-[11px] text-zinc-500 font-mono">{mySales.length} Transaksi</span>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-4">Unit Motor</th>
                <th className="py-2.5 px-4">No. Polisi</th>
                <th className="py-2.5 px-4">Tanggal</th>
                <th className="py-2.5 px-4">Pembeli</th>
                <th className="py-2.5 px-4">Metode</th>
                <th className="py-2.5 px-4 text-end">Harga Deal</th>
                <th className="py-2.5 px-4 text-end font-mono">Komisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {mySales.length > 0 ? (
                mySales.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-800/40">
                    <td className="py-2.5 px-4 font-bold text-zinc-100">{tx.unitName}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{tx.plate}</td>
                    <td className="py-2.5 px-4 text-zinc-400 font-mono">{tx.date}</td>
                    <td className="py-2.5 px-4 text-zinc-300">{tx.buyerName}</td>
                    <td className="py-2.5 px-4 uppercase font-mono text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded ${
                        tx.paymentMethod === 'dp-tempo' 
                          ? 'bg-amber-950 text-amber-400 border border-amber-800' 
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-end font-mono font-semibold text-zinc-200">
                      {formatIDR(tx.dealPrice)}
                    </td>
                    <td className="py-2.5 px-4 text-end font-mono font-bold text-emerald-400">
                      {formatIDR(tx.commission)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-zinc-500">
                    Belum ada transaksi penjualan pada rentang tanggal ini.
                  </td>
                </tr>
              )}
            </tbody>
            {mySales.length > 0 && (
              <tfoot className="bg-zinc-950 font-bold border-t border-zinc-800 text-zinc-200">
                <tr>
                  <td colSpan={5} className="py-3 px-4 uppercase tracking-wider text-[11px]">
                    TOTAL KESELURUHAN
                  </td>
                  <td className="py-3 px-4 text-end font-mono text-zinc-100 text-sm">
                    {formatIDR(totalOmset)}
                  </td>
                  <td className="py-3 px-4 text-end font-mono text-emerald-400 text-sm">
                    {formatIDR(totalCommission)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-zinc-800/80">
          {mySales.length > 0 ? (
            mySales.map((tx) => (
              <div key={tx.id} className="p-3 space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-zinc-100">{tx.unitName}</h4>
                    <span className="font-mono text-[11px] font-bold text-amber-400">{tx.plate}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    +{formatIDR(tx.commission)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/60 pt-1.5">
                  <span>Pembeli: <strong>{tx.buyerName}</strong></span>
                  <span>Tgl: {tx.date}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Harga Deal: {formatIDR(tx.dealPrice)}</span>
                  <span className="uppercase text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                    {tx.paymentMethod}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-zinc-500 text-xs">
              Belum ada transaksi penjualan pada periode ini.
            </div>
          )}

          {mySales.length > 0 && (
            <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center text-xs font-bold">
              <span className="text-zinc-300 uppercase">TOTAL KOMISI:</span>
              <span className="text-emerald-400 font-mono text-base">{formatIDR(totalCommission)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
