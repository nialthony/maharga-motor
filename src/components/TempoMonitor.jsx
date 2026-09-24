import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  MessageCircle, 
  CheckCircle2, 
  Calendar,
  Check,
  X
} from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function TempoMonitor({ salesList = [], onPayRemaining }) {
  const [searchTerm, setSearchTerm] = useState('');

  const tempoList = salesList.filter(s => {
    const isTempo = s.paymentMethod === 'dp-tempo' && s.status === 'Tempo Aktif';
    if (!isTempo) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.buyerName?.toLowerCase().includes(term) ||
      s.plate?.toLowerCase().includes(term) ||
      s.unitName?.toLowerCase().includes(term) ||
      s.id?.toLowerCase().includes(term)
    );
  });

  const totalReceivables = tempoList.reduce((acc, curr) => acc + (curr.remainingAmount || 0), 0);

  const handleSendReminderWA = (tx) => {
    const text = `
*PENGINGAT JATUH TEMPO - MAHARGA MOTOR* 🏍️

Halo Bpk/Ibu *${tx.buyerName}*,
Semoga dalam keadaan sehat.

Kami menginfokan perihal sisa pelunasan unit motor *${tx.unitName} (Nopol: ${tx.plate})*:

• Sisa Pelunasan: *${formatIDR(tx.remainingAmount)}*
• Tanggal Jatuh Tempo: *${tx.dueDate}*
• Jaminan Tersimpan: _${tx.guarantee}_

Pelunasan dapat dilakukan langsung di Showroom Maharga Motor atau transfer ke rekening resmi:
🏦 *BCA: 0158-992-881 (a/n Maharga Motor)*

Jika sudah melakukan transfer, mohon kirimkan bukti pelunasan agar berkas jaminan dapat diserahterimakan. Terima kasih! 🙏
    `.trim();

    const url = `https://wa.me/${tx.buyerPhone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5 pb-20 md:pb-12">
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2 font-mono">
              <Clock className="w-5 h-5 text-amber-400" />
              Monitoring Piutang & Titip DP (Tempo)
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
              {tempoList.length} Aktif
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Daftar transaksi dengan skema titip uang muka (DP), sisa piutang, dan jaminan fisik yang disimpan showroom.
          </p>
        </div>

        {/* Functional Search Bar */}
        <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            aria-label="Cari transaksi tempo"
            placeholder="Cari nopol, nama pembeli..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none w-full text-xs"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              aria-label="Hapus kata kunci pencarian"
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Transaksi Tempo Aktif</span>
          <h3 className="text-2xl font-black font-mono text-zinc-100">{tempoList.length} Transaksi</h3>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Piutang Belum Lunas</span>
          <h3 className="text-2xl font-black font-mono text-amber-400">
            {formatIDR(totalReceivables)}
          </h3>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Jaminan Fisik Tersimpan</span>
          <h3 className="text-2xl font-black font-mono text-emerald-400">{tempoList.length} Dokumen</h3>
        </div>
      </div>

      {/* Table / Empty State */}
      <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Daftar Piutang Tempo Berjalan</h3>
          <span className="text-[11px] font-mono text-zinc-500">{tempoList.length} Data</span>
        </div>

        {tempoList.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-200">
                {searchTerm ? 'Tidak Ada Hasil yang Cocok' : 'Tidak Ada Tagihan Tempo Aktif'}
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {searchTerm 
                  ? `Tidak ada transaksi yang cocok dengan kata kunci "${searchTerm}".`
                  : 'Seluruh transaksi penjualan showroom saat ini berstatus Cash Lunas atau belum ada transaksi Titip DP berjalan.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">No. Transaksi</th>
                    <th className="py-3 px-4">Unit Motor</th>
                    <th className="py-3 px-4">Pembeli / HP</th>
                    <th className="py-3 px-4">DP Diterima</th>
                    <th className="py-3 px-4">Sisa Piutang</th>
                    <th className="py-3 px-4">Jatuh Tempo</th>
                    <th className="py-3 px-4">Jaminan Fisik</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {tempoList.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-800/40 transition-colors font-sans">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-400">{tx.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-100">{tx.unitName}</div>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">{tx.plate}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-200">{tx.buyerName}</div>
                        <span className="text-[10px] text-zinc-500 font-mono">{tx.buyerPhone}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                        {formatIDR(tx.dpAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-amber-400 text-sm">
                        {formatIDR(tx.remainingAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-200 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          {tx.dueDate}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-[11px] text-zinc-400" title={tx.guarantee}>
                        {tx.guarantee}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => handleSendReminderWA(tx)}
                            aria-label={`Kirim pengingat WhatsApp ke ${tx.buyerName}`}
                            className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-semibold text-[11px] transition-colors flex items-center gap-1 border border-zinc-700 min-h-[32px]"
                          >
                            <MessageCircle className="w-3 h-3" />
                            WA Tagih
                          </button>
                          <button
                            onClick={() => onPayRemaining(tx.id)}
                            aria-label={`Konfirmasi pelunasan untuk transaksi ${tx.id}`}
                            className="px-2.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] transition-colors flex items-center gap-1 min-h-[32px]"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            Pelunasan
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-zinc-800">
              {tempoList.map((tx) => (
                <div key={tx.id} className="p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-zinc-100">{tx.unitName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-amber-400 font-mono font-bold text-[11px]">{tx.plate}</span>
                        <span className="text-zinc-500 font-mono text-[10px]">#{tx.id}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">Sisa Piutang:</span>
                      <span className="font-mono font-black text-amber-400 text-sm">{formatIDR(tx.remainingAmount)}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Pembeli:</span>
                      <span className="font-semibold text-zinc-200">{tx.buyerName} ({tx.buyerPhone})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">DP Awal:</span>
                      <span className="font-mono text-emerald-400">{formatIDR(tx.dpAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Jatuh Tempo:</span>
                      <span className="font-mono text-amber-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {tx.dueDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Jaminan:</span>
                      <span className="text-zinc-300 truncate max-w-[180px]">{tx.guarantee}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleSendReminderWA(tx)}
                      aria-label={`Kirim pengingat WhatsApp ke ${tx.buyerName}`}
                      className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-zinc-700 min-h-[44px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WA Tagih
                    </button>
                    <button
                      onClick={() => onPayRemaining(tx.id)}
                      aria-label={`Konfirmasi pelunasan transaksi ${tx.id}`}
                      className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Pelunasan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
