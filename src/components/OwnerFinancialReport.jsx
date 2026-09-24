import React, { useState } from 'react';
import { Download, Printer, X } from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function OwnerFinancialReport({ salesList = [], employees = [], units = [] }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSlipStaff, setSelectedSlipStaff] = useState(null);

  const filteredSales = salesList.filter(s => {
    return (!startDate || s.date >= startDate) && (!endDate || s.date <= endDate);
  });

  const totalOmset = filteredSales.reduce((acc, curr) => acc + (curr.dealPrice || 0), 0);

  // Real HPP calculation derived from registered units and repairs
  const totalModalHPP = filteredSales.reduce((acc, tx) => {
    const matchedUnit = units.find(u => u.id === tx.unitId);
    if (matchedUnit) {
      return acc + (matchedUnit.buyPrice || 0) + (matchedUnit.repairCost || 0);
    }
    return acc;
  }, 0);

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
      deals: staffDeals,
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
              PORTAL OWNER
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Laporan laba kotor, perputaran modal HPP riil, dan rekapitulasi komisi seluruh tim sales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            <input
              type="date"
              aria-label="Tanggal mulai laporan"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent px-1.5 py-0.5 text-zinc-200 focus:outline-none font-mono text-[11px] sm:text-xs"
            />
            <span className="text-zinc-600 px-0.5">-</span>
            <input
              type="date"
              aria-label="Tanggal akhir laporan"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent px-1.5 py-0.5 text-zinc-200 focus:outline-none font-mono text-[11px] sm:text-xs"
            />
          </div>

          <button
            onClick={() => window.print()}
            aria-label="Cetak rekap laporan"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1 transition-colors shrink-0 min-h-[36px]"
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
          <p className="text-[10px] text-zinc-500">Total deal transaksi masuk</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Modal HPP Riil</span>
          <h3 className="text-xl sm:text-2xl font-black font-mono text-zinc-300">{formatIDR(totalModalHPP)}</h3>
          <p className="text-[10px] text-zinc-500">Harga beli + perbaikan servis</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Estimasi Laba Kotor</span>
          <h3 className="text-xl sm:text-2xl font-black font-mono text-amber-400">{formatIDR(grossProfit)}</h3>
          <p className="text-[10px] text-zinc-500">Omset dikurangi modal unit</p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-1">
          <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Laba Bersih Showroom</span>
          <h3 className="text-xl sm:text-2xl font-black font-mono text-emerald-400">{formatIDR(netOperationalProfit)}</h3>
          <p className="text-[10px] text-emerald-300/80">Setelah komisi tim sales</p>
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
                      onClick={() => setSelectedSlipStaff(staff)}
                      disabled={staff.unitCount === 0}
                      aria-label={`Buka slip komisi ${staff.name}`}
                      className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-[11px] font-sans font-semibold border border-zinc-700 min-h-[32px] transition-colors"
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
            <div key={staff.id} className="p-3.5 space-y-2.5 text-xs">
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

              <div className="flex justify-between items-center text-[11px] text-zinc-400 border-t border-zinc-800/60 pt-2">
                <span>Unit Terjual: <strong>{staff.unitCount} Unit</strong></span>
                <span>Omset: {formatIDR(staff.omset)}</span>
              </div>

              {staff.unitCount > 0 && (
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => setSelectedSlipStaff(staff)}
                    aria-label={`Buka slip komisi ${staff.name}`}
                    className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 min-h-[44px] flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Slip Komisi
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Real Slip Modal */}
      {selectedSlipStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl my-6">
            <div className="p-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between no-print">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                Slip Komisi Penjualan
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  aria-label="Cetak slip komisi sekarang"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors min-h-[36px]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak PDF
                </button>
                <button
                  onClick={() => setSelectedSlipStaff(null)}
                  aria-label="Tutup slip komisi"
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-white text-zinc-900 space-y-4" id="printable-document">
              <div className="border-b-2 border-zinc-900 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black tracking-tight">MAHARGA MOTOR</h2>
                  <p className="text-xs text-zinc-600">Jual Beli Motor Bekas Berkualitas & Cash-Tempo</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-zinc-100 border border-zinc-300 rounded">
                    SLIP KOMISI RESMI
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-1 font-mono">{new Date().toLocaleDateString('id-ID')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 p-3 rounded border border-zinc-200">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Penerima Komisi:</span>
                  <strong className="text-zinc-900 text-sm">{selectedSlipStaff.name}</strong>
                  <span className="text-zinc-500 block text-[11px] font-mono">@{selectedSlipStaff.username}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block text-[10px]">Total Unit Terjual:</span>
                  <strong className="text-zinc-900 text-sm font-mono">{selectedSlipStaff.unitCount} Unit</strong>
                  <span className="text-zinc-500 block text-[11px]">Total Omset: {formatIDR(selectedSlipStaff.omset)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">Rincian Penjualan:</span>
                <table className="w-full text-left text-xs border border-zinc-300">
                  <thead className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-300">
                    <tr>
                      <th className="p-2">Unit Motor</th>
                      <th className="p-2">Plat</th>
                      <th className="p-2 text-end">Harga Deal</th>
                      <th className="p-2 text-end">Komisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono">
                    {selectedSlipStaff.deals.map((deal) => (
                      <tr key={deal.id}>
                        <td className="p-2 font-sans font-medium text-zinc-900">{deal.unitName}</td>
                        <td className="p-2 text-zinc-700">{deal.plate}</td>
                        <td className="p-2 text-end">{formatIDR(deal.dealPrice)}</td>
                        <td className="p-2 text-end font-bold text-emerald-700">+{formatIDR(deal.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-100 font-bold border-t-2 border-zinc-900">
                    <tr>
                      <td colSpan={3} className="p-2 text-end text-zinc-800 uppercase font-sans text-xs">Total Komisi Diterima:</td>
                      <td className="p-2 text-end font-mono text-emerald-700 text-sm">{formatIDR(selectedSlipStaff.commission)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs">
                <div>
                  <p className="text-zinc-500 mb-10">Penerima (Sales),</p>
                  <p className="font-bold underline text-zinc-900">{selectedSlipStaff.name}</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-10">Mengetahui (Owner),</p>
                  <p className="font-bold underline text-zinc-900">H. Maharga</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
