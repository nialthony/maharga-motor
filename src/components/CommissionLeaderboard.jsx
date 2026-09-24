import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  Wallet, 
  Bike, 
  Calendar,
  Download
} from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function CommissionLeaderboard({ salesList, currentUser, employees }) {
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-30');
  const [selectedSalesId, setSelectedSalesId] = useState(
    currentUser.role === 'sales' ? currentUser.id : 'all'
  );

  const isOwner = currentUser.role === 'owner' || currentUser.role === 'admin';

  // Filter sales based on logged in user or owner selection and date range
  const filteredSales = salesList.filter(s => {
    const matchSales = selectedSalesId === 'all' 
      ? true 
      : s.salesId === Number(selectedSalesId) || s.salesName.toLowerCase().includes(currentUser.name.toLowerCase());
    
    const matchDate = (!startDate || s.date >= startDate) && (!endDate || s.date <= endDate);
    return matchSales && matchDate;
  });

  const totalUnitSold = filteredSales.length;
  const totalOmset = filteredSales.reduce((acc, curr) => acc + (curr.dealPrice || 0), 0);
  const totalCommission = filteredSales.reduce((acc, curr) => acc + (curr.commission || 0), 0);
  const commissionRatePerUnit = totalUnitSold > 0 ? Math.round(totalCommission / totalUnitSold) : 350000;

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Date Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-100">
              {currentUser.role === 'sales' ? 'Laporan Komisi Saya' : `Laporan Komisi Penjualan: ${selectedSalesId === 'all' ? 'Semua Sales' : employees.find(e => e.id === Number(selectedSalesId))?.name || 'Sales'}`}
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Komisi: {formatIDR(commissionRatePerUnit)} / Unit
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Akun: <strong>{currentUser.name}</strong> • Periode laporan kinerja penjualan
          </p>
        </div>

        {/* Date Filter & Sales Selector for Owner */}
        <div className="flex flex-wrap items-center gap-2">
          {isOwner && (
            <select
              value={selectedSalesId}
              onChange={(e) => setSelectedSalesId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="all">Semua Tim Sales</option>
              {employees.filter(e => e.role === 'sales').map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent px-2 py-0.5 text-xs text-zinc-200 focus:outline-none font-mono"
            />
            <span className="text-zinc-600 px-1">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent px-2 py-0.5 text-xs text-zinc-200 focus:outline-none font-mono"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Cetak
          </button>
        </div>
      </div>

      {/* Summary KPI Boxes (Matching mahargamotor.com structure) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Box 1: UNIT TERJUAL */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 border-l-4 border-l-amber-500 space-y-1">
          <small className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">UNIT TERJUAL</small>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black font-mono text-zinc-100">{totalUnitSold}</h3>
            <span className="text-xs text-zinc-400">Unit</span>
          </div>
          <p className="text-[11px] text-zinc-500">Total transaksi unit terverifikasi lunas / titip DP</p>
        </div>

        {/* Box 2: ESTIMASI KOMISI CAIR */}
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 border-l-4 border-l-emerald-500 space-y-1">
          <div className="flex items-center justify-between">
            <small className="text-emerald-300 font-bold uppercase tracking-wider text-[10px]">ESTIMASI KOMISI CAIR</small>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-black font-mono text-emerald-400">
            {formatIDR(totalCommission)}
          </h3>
          <p className="text-[11px] text-emerald-300/80">Siap dicairkan pada periode berjalan</p>
        </div>
      </div>

      {/* Rincian Penjualan Table */}
      <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Rincian Penjualan Unit</h3>
          <span className="text-xs text-zinc-500 font-mono">{filteredSales.length} Transaksi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-4">Unit Motor</th>
                <th className="py-2.5 px-4">No. Polisi</th>
                <th className="py-2.5 px-4">Tanggal</th>
                <th className="py-2.5 px-4">Nama Pembeli</th>
                <th className="py-2.5 px-4">Metode Bayar</th>
                <th className="py-2.5 px-4 text-end">Harga Deal</th>
                <th className="py-2.5 px-4 text-end font-mono">Komisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredSales.length > 0 ? (
                filteredSales.map((tx) => (
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
                    Tidak ada transaksi penjualan pada rentang tanggal yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredSales.length > 0 && (
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
      </div>
    </div>
  );
}
