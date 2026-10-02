import React, { useState } from 'react';
import { 
  Download, 
  Printer, 
  X, 
  Eye, 
  TrendingUp, 
  FileText
} from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function OwnerFinancialReport({ 
  salesList = [], 
  employees = [], 
  units = [], 
  onPrintReceipt 
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportMode, setReportMode] = useState('accrual'); // 'accrual' | 'cash_flow'
  const [selectedSlipStaff, setSelectedSlipStaff] = useState(null);
  const [selectedUnitDetail, setSelectedUnitDetail] = useState(null);

  // Filter sales based on date
  const filteredSales = salesList.filter(s => {
    return (!startDate || s.date >= startDate) && (!endDate || s.date <= endDate);
  });

  // Accrual Financial Calculations (Profit Terjual)
  const totalOmset = filteredSales.reduce((acc, curr) => acc + (curr.dealPrice || 0), 0);

  const salesWithEconomics = filteredSales.map(tx => {
    const matchedUnit = units.find(u => u.id === tx.unitId || (tx.plate && u.plate === tx.plate));
    const buyPrice = matchedUnit ? (matchedUnit.buyPrice || 0) : 0;
    const repairCost = matchedUnit ? (matchedUnit.repairCost || 0) : 0;
    const totalUnitModal = buyPrice + repairCost;
    const commission = tx.commission || 0;
    const unitProfit = (tx.dealPrice || 0) - totalUnitModal - commission;
    const isTempo = tx.paymentMethod === 'dp-tempo';

    return {
      ...tx,
      unitName: tx.unitName || (matchedUnit ? `${matchedUnit.brand} ${matchedUnit.model}` : 'Unit Motor'),
      buyPrice,
      repairCost,
      totalUnitModal,
      commission,
      unitProfit,
      isTempo,
      dpAmount: tx.dpAmount || 0,
      remainingAmount: tx.remainingAmount || 0
    };
  });

  const totalBuyPrice = salesWithEconomics.reduce((acc, curr) => acc + curr.buyPrice, 0);
  const totalRepairCost = salesWithEconomics.reduce((acc, curr) => acc + curr.repairCost, 0);
  const totalModalHPP = totalBuyPrice + totalRepairCost;
  const totalCommission = salesWithEconomics.reduce((acc, curr) => acc + curr.commission, 0);
  const totalNetProfit = totalOmset - totalModalHPP - totalCommission;

  // Cash Flow Calculations (Arus Kas Masuk vs Keluar)
  const cashIn = filteredSales.reduce((acc, tx) => {
    if (tx.paymentMethod === 'dp-tempo') {
      return acc + (tx.dpAmount || 0);
    }
    return acc + (tx.dealPrice || 0);
  }, 0);

  const totalReceivables = filteredSales.reduce((acc, tx) => {
    return acc + (tx.remainingAmount || 0);
  }, 0);

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
    <div className="space-y-5 pb-20 md:pb-12">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Laporan Keuangan & Laba Rugi
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Analisis profitabilitas berbasis Accrual (unit laku) dan Arus Kas riil showroom.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dual Mode Switcher matching live system */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setReportMode('accrual')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                reportMode === 'accrual'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Accrual (Profit Terjual)
            </button>
            <button
              onClick={() => setReportMode('cash_flow')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                reportMode === 'cash_flow'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cash Flow (Arus Kas)
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center bg-zinc-950 px-2 py-1.5 rounded-xl border border-zinc-800 text-xs font-mono">
            <input
              type="date"
              aria-label="Tanggal mulai"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-zinc-200 focus:outline-none text-[11px]"
            />
            <span className="text-zinc-600 px-1">-</span>
            <input
              type="date"
              aria-label="Tanggal akhir"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-zinc-200 focus:outline-none text-[11px]"
            />
          </div>

          <button
            onClick={() => window.print()}
            aria-label="Cetak rekap laporan"
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Dynamic based on selected mode */}
      {reportMode === 'accrual' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Omset Penjualan</span>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-zinc-100">{formatIDR(totalOmset)}</h3>
            <p className="text-[10px] text-zinc-500">{filteredSales.length} unit motor terjual</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Modal HPP</span>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-zinc-300">{formatIDR(totalModalHPP)}</h3>
            <p className="text-[10px] text-zinc-500">Beli: {formatIDR(totalBuyPrice)} • Servis: {formatIDR(totalRepairCost)}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Beban Komisi Sales</span>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-amber-400">{formatIDR(totalCommission)}</h3>
            <p className="text-[10px] text-zinc-500">Insentif tim sales</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-800/80 space-y-1 bg-emerald-950/20">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Laba Bersih Showroom</span>
            <h3 className={`text-xl sm:text-2xl font-black font-mono ${totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatIDR(totalNetProfit)}
            </h3>
            <p className="text-[10px] text-emerald-300/70">Bersih setelah seluruh beban</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Arus Kas Masuk (Cash/Transfer/DP)</span>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-emerald-400">{formatIDR(cashIn)}</h3>
            <p className="text-[10px] text-zinc-500">Uang riil yang telah diterima</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Piutang Berjalan (Tempo)</span>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-amber-400">{formatIDR(totalReceivables)}</h3>
            <p className="text-[10px] text-zinc-500">Sisa tagihan tempo konsumen</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Modal & Servis Terjual</span>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-zinc-300">{formatIDR(totalModalHPP)}</h3>
            <p className="text-[10px] text-zinc-500">Modal unit yang laku</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Net Cash Terkumpul</span>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-emerald-400">{formatIDR(cashIn - totalCommission)}</h3>
            <p className="text-[10px] text-zinc-500">Setelah beban komisi tunai</p>
          </div>
        </div>
      )}

      {/* Rincian Finansial Per Unit Terjual Table */}
      <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Rincian Analisis Finansial per Unit Terjual
            </h3>
            <p className="text-[11px] text-zinc-400">Klik ikon mata untuk melihat kalkulasi modal, repair, dan profit bersih setiap unit motor</p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400">{filteredSales.length} Transaksi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Deskripsi / Tanggal</th>
                <th className="py-3 px-4">Sales</th>
                <th className="py-3 px-4">Status & Metode</th>
                <th className="py-3 px-4 text-end">Harga Deal</th>
                <th className="py-3 px-4 text-end">Laba Bersih</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {salesWithEconomics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-500">
                    Tidak ada transaksi penjualan pada rentang periode yang dipilih.
                  </td>
                </tr>
              ) : (
                salesWithEconomics.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-zinc-100">{item.unitName}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-0.5">
                        <span className="text-amber-400 font-bold">{item.plate}</span>
                        <span>•</span>
                        <span>{item.date}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-300 font-medium">
                      {item.salesName || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 inline-block mb-0.5">
                        Terjual
                      </span>
                      <span className="text-[10px] text-zinc-400 block font-mono capitalize">
                        {item.paymentMethod === 'dp-tempo' ? 'Cash-Tempo' : item.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end font-mono font-bold text-zinc-100">
                      {formatIDR(item.dealPrice)}
                    </td>
                    <td className="py-3 px-4 text-end font-mono font-bold">
                      <span className={item.unitProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatIDR(item.unitProfit)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onPrintReceipt && (
                          <button
                            onClick={() => onPrintReceipt(item)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                            title="Cetak Kwitansi Resmi"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedUnitDetail(item)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition-colors"
                          title="Lihat Rincian Analisa Unit"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rekapitulasi Komisi Tim Sales */}
      <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Rekapitulasi Komisi Tim Sales
            </h3>
            <p className="text-[11px] text-zinc-400">Total komisi per sales berdasarkan unit deal terjual</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            Total Komisi: {formatIDR(totalCommission)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Nama Staf Sales</th>
                <th className="py-3 px-4 text-center">Unit Terjual</th>
                <th className="py-3 px-4 text-end">Total Omset</th>
                <th className="py-3 px-4 text-end">Total Komisi</th>
                <th className="py-3 px-4 text-center">Slip Gaji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {salesSummary.map((staff) => (
                <tr key={staff.id} className="hover:bg-zinc-800/40">
                  <td className="py-3 px-4 font-bold text-zinc-100">
                    <div>{staff.name}</div>
                    <span className="text-[10px] text-zinc-500 font-mono">@{staff.username}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      {staff.unitCount} Unit
                    </span>
                  </td>
                  <td className="py-3 px-4 text-end font-mono font-semibold text-zinc-300">
                    {formatIDR(staff.omset)}
                  </td>
                  <td className="py-3 px-4 text-end font-mono font-bold text-emerald-400">
                    {formatIDR(staff.commission)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {staff.unitCount > 0 && (
                      <button
                        onClick={() => setSelectedSlipStaff(staff)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 mx-auto transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Slip</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Drill-Down Detail Unit (Matching Live System viewDetail) */}
      {selectedUnitDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl space-y-4">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Rincian Laba Unit Motor</span>
                </h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Analisis modal HPP dan margin per transaksi</p>
              </div>
              <button
                onClick={() => setSelectedUnitDetail(null)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="border-b border-zinc-800 pb-2">
                <h5 className="font-bold text-amber-400 text-sm">{selectedUnitDetail.unitName}</h5>
                <span className="text-[11px] font-mono text-zinc-400">{selectedUnitDetail.plate} • Sales: {selectedUnitDetail.salesName || '-'}</span>
              </div>

              <div className="space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Modal Beli:</span>
                  <span className="font-mono font-bold text-zinc-200">{formatIDR(selectedUnitDetail.buyPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Biaya Repair / Servis:</span>
                  <span className="font-mono font-bold text-rose-400">+ {formatIDR(selectedUnitDetail.repairCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Beban Komisi Sales:</span>
                  <span className="font-mono font-bold text-amber-400">+ {formatIDR(selectedUnitDetail.commission)}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-sm">
                  <span className="text-zinc-200">HARGA DEAL JUAL:</span>
                  <span className="font-mono text-zinc-100">{formatIDR(selectedUnitDetail.dealPrice)}</span>
                </div>
                <div className={`p-2.5 rounded-xl border flex justify-between font-bold text-sm ${
                  selectedUnitDetail.unitProfit >= 0 
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
                    : 'bg-rose-950/40 border-rose-800 text-rose-400'
                }`}>
                  <span>LABA BERSIH UNIT:</span>
                  <span className="font-mono">{formatIDR(selectedUnitDetail.unitProfit)}</span>
                </div>
              </div>

              {selectedUnitDetail.isTempo && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-1 text-[11px]">
                  <span className="font-bold text-amber-400 uppercase text-[10px] block">Informasi Skema Titip DP (Tempo):</span>
                  <div className="flex justify-between text-zinc-300">
                    <span>DP Diterima:</span>
                    <strong className="font-mono text-emerald-400">{formatIDR(selectedUnitDetail.dpAmount)}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Sisa Piutang:</span>
                    <strong className="font-mono text-rose-400">{formatIDR(selectedUnitDetail.remainingAmount)}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Jatuh Tempo:</span>
                    <span className="font-mono text-amber-300">{selectedUnitDetail.dueDate || '-'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
              {onPrintReceipt && (
                <button
                  onClick={() => onPrintReceipt(selectedUnitDetail)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Kwitansi</span>
                </button>
              )}
              <button
                onClick={() => setSelectedUnitDetail(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium ml-auto"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <img src="/logo.png" alt="Maharga Motor" className="h-8 w-auto object-contain mb-1" />
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
