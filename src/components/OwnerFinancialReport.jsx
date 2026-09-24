import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Download, 
  Users, 
  Wallet, 
  Building, 
  CheckCircle2, 
  FileText,
  Calendar
} from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function OwnerFinancialReport({ salesList = [], employees = [] }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredSales = salesList.filter(s => {
    return (!startDate || s.date >= startDate) && (!endDate || s.date <= endDate);
  });

  const totalOmset = filteredSales.reduce((acc, curr) => acc + (curr.dealPrice || 0), 0);
  const totalModalHPP = totalOmset > 0 ? Math.round(totalOmset * 0.88) : 0;
  const totalCommissionDisbursed = filteredSales.reduce((acc, curr) => acc + (curr.commission || 0), 0);
  const grossProfit = totalOmset - totalModalHPP;
  const netOperationalProfit = grossProfit - totalCommissionDisbursed;

  // Group by sales staff
  const salesStaff = employees.filter(e => e.role === 'sales');
  const salesSummary = salesStaff.map(staff => {
    const staffDeals = filteredSales.filter(s => s.salesId === staff.id || s.salesName?.toLowerCase().includes(staff.name.toLowerCase()));
    const unitCount = staffDeals.length;
    const omset = staffDeals.reduce((acc, curr) => acc + curr.dealPrice, 0);
    const commission = staffDeals.reduce((acc, curr) => acc + curr.commission, 0);

    return {
      id: staff.id,
      name: staff.name,
      username: staff.username,
      unitCount,
      omset,
      commission,
      status: unitCount > 0 ? 'Siap Dicairkan' : 'Belum Ada Penjualan'
    };
  });

  return (
    <div className="space-y-4 pb-20 md:pb-12">
      {/* Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 p-3.5 sm:p-4 rounded-xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-zinc-100 font-mono">
              Laporan Finansial & Penggajian Komisi Showroom
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
              👑 KHUSUS OWNER
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Laporan laba kotor, perputaran modal HPP, dan rekapitulasi beban komisi seluruh tim sales secara riil.
          </p>
        </div>

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
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Omset Showroom</span>
          <h3 className="text-xl sm:text-2xl font-black font-mono text-zinc-100">{formatIDR(totalOmset)}</h3>
          <p className="text-[10px] text-zinc-500">Total deal penjualan masuk</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Modal HPP Motor</span>
          <h3 className="text-xl sm:text-2xl font-black font-mono text-zinc-300">{formatIDR(totalModalHPP)}</h3>
          <p className="text-[10px] text-zinc-500">Harga beli + perbaikan servis</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Estimasi Laba Kotor</span>
          <h3 className="text-xl sm:text-2xl font-black font-mono text-amber-400">{formatIDR(grossProfit)}</h3>
          <p className="text-[10px] text-zinc-500">Omset dikurangi modal</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-1">
          <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Laba Bersih Showroom</span>
          <h3 className="text-xl sm:text-2xl font-black font-mono text-emerald-400">{formatIDR(netOperationalProfit)}</h3>
          <p className="text-[10px] text-emerald-300/80">Setelah dipotong komisi sales</p>
        </div>
      </div>

      {/* Rekap Komisi Sales Table */}
      <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Rekapitulasi Penggajian Komisi Tim Sales
            </h3>
            <p className="text-[11px] text-zinc-500">Daftar beban komisi yang wajib dibayarkan ke masing-masing staf sales</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            Total Beban: {formatIDR(totalCommissionDisbursed)}
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-4">Nama Staf Sales</th>
                <th className="py-2.5 px-4">Username</th>
                <th className="py-2.5 px-4 text-center">Unit Terjual</th>
                <th className="py-2.5 px-4 text-end">Omset Dihasilkan</th>
                <th className="py-2.5 px-4 text-end font-mono">Beban Komisi Wajib</th>
                <th className="py-2.5 px-4 text-center">Status Pembayaran</th>
                <th className="py-2.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {salesSummary.map((staff) => (
                <tr key={staff.id} className="hover:bg-zinc-800/40">
                  <td className="py-2.5 px-4 font-bold text-zinc-100 font-sans">{staff.name}</td>
                  <td className="py-2.5 px-4 text-amber-400">@{staff.username}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-zinc-200">{staff.unitCount} Unit</td>
                  <td className="py-2.5 px-4 text-end text-zinc-300">{formatIDR(staff.omset)}</td>
                  <td className="py-2.5 px-4 text-end font-black text-emerald-400 text-sm">
                    {formatIDR(staff.commission)}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      staff.unitCount > 0 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {staff.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => alert(`Slip komisi ${staff.name} (${formatIDR(staff.commission)}) telah dicetak.`)}
                      disabled={staff.unitCount === 0}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-[11px] font-sans font-semibold border border-zinc-700"
                    >
                      Cetak Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-zinc-800">
          {salesSummary.map((staff) => (
            <div key={staff.id} className="p-3 space-y-2 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-zinc-100">{staff.name}</h4>
                  <span className="text-[10px] text-amber-400 font-mono">@{staff.username}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block">Komisi:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{formatIDR(staff.commission)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-zinc-400 border-t border-zinc-800/60 pt-1.5">
                <span>Unit Terjual: <strong>{staff.unitCount} Unit</strong></span>
                <span>Omset: {formatIDR(staff.omset)}</span>
              </div>

              {staff.unitCount > 0 && (
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => alert(`Slip komisi ${staff.name} telah dicetak.`)}
                    className="px-3 py-1 rounded bg-zinc-800 text-zinc-200 font-semibold text-[11px] border border-zinc-700"
                  >
                    Cetak Slip Komisi
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
