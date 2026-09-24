import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  CheckCircle2
} from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function DocumentPrintModal({ transaction, onClose }) {
  const [docType, setDocType] = useState('spk'); // 'spk' | 'kwitansi'

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl my-8">
        {/* Top Controls */}
        <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setDocType('spk')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                docType === 'spk' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Surat Perjanjian (SPK)
            </button>
            <button
              onClick={() => setDocType('kwitansi')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                docType === 'kwitansi' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Kwitansi Resmi
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="p-8 bg-white text-zinc-900 font-sans max-h-[80vh] overflow-y-auto" id="printable-document">
          {/* Header */}
          <div className="border-b-2 border-zinc-900 pb-3 mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black tracking-tight text-zinc-950 font-mono">
                MAHARGA MOTOR
              </h1>
              <p className="text-xs text-zinc-600 font-medium">
                Pusat Jual Beli Sepeda Motor Bekas Berkualitas & Bergaransi
              </p>
              <p className="text-[11px] text-zinc-500">
                Jl. Raya Solo - Sukoharjo • Telp/WA: 0812-3456-7890
              </p>
            </div>

            <div className="text-right font-mono">
              <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-bold text-xs border border-zinc-300">
                {transaction.id}
              </span>
              <p className="text-[11px] text-zinc-500 mt-1">Tgl: {transaction.date}</p>
            </div>
          </div>

          {/* SPK */}
          {docType === 'spk' && (
            <div className="space-y-4 text-xs text-zinc-800">
              <div className="text-center space-y-0.5">
                <h2 className="text-sm font-black uppercase underline tracking-wide">
                  SURAT PERJANJIAN JUAL BELI & SERAH TERIMA KENDARAAN (SPK)
                </h2>
                <p className="text-[10px] text-zinc-500">Nomor: SPK/{transaction.id}/MM/2026</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-zinc-900 border-b pb-0.5">I. PIHAK TERKAIT</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-zinc-50 rounded border border-zinc-200">
                    <span className="font-bold block text-[10px] text-zinc-500">PENJUAL:</span>
                    <p className="font-bold">Showroom Maharga Motor</p>
                    <p>Sales: {transaction.salesName}</p>
                  </div>
                  <div className="p-2.5 bg-zinc-50 rounded border border-zinc-200">
                    <span className="font-bold block text-[10px] text-zinc-500">PEMBELI:</span>
                    <p className="font-bold">{transaction.buyerName}</p>
                    <p>HP: {transaction.buyerPhone}</p>
                    <p>Alamat: {transaction.buyerAddress || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-zinc-900 border-b pb-0.5">II. DETAIL OBJEK KENDARAAN</h3>
                <table className="w-full text-left border-collapse border border-zinc-300">
                  <tbody>
                    <tr className="border-b border-zinc-300">
                      <td className="p-2 bg-zinc-100 font-bold w-1/3">Tipe / Merk:</td>
                      <td className="p-2 font-bold">{transaction.unitName}</td>
                    </tr>
                    <tr className="border-b border-zinc-300">
                      <td className="p-2 bg-zinc-100 font-bold">Nomor Polisi:</td>
                      <td className="p-2 font-mono font-bold text-amber-800">{transaction.plate}</td>
                    </tr>
                    <tr className="border-b border-zinc-300">
                      <td className="p-2 bg-zinc-100 font-bold">Harga Kesepakatan:</td>
                      <td className="p-2 font-bold text-emerald-800 text-sm">{formatIDR(transaction.dealPrice)}</td>
                    </tr>
                    <tr className="border-b border-zinc-300">
                      <td className="p-2 bg-zinc-100 font-bold">Metode Pembayaran:</td>
                      <td className="p-2 font-mono uppercase font-bold">{transaction.paymentMethod}</td>
                    </tr>
                    {transaction.paymentMethod === 'dp-tempo' && (
                      <>
                        <tr className="border-b border-zinc-300">
                          <td className="p-2 bg-zinc-100 font-bold">Uang Muka (DP Masuk):</td>
                          <td className="p-2 font-bold text-emerald-800">{formatIDR(transaction.dpAmount)}</td>
                        </tr>
                        <tr className="border-b border-zinc-300">
                          <td className="p-2 bg-zinc-100 font-bold">Sisa Pelunasan:</td>
                          <td className="p-2 font-bold text-rose-800">{formatIDR(transaction.remainingAmount)}</td>
                        </tr>
                        <tr className="border-b border-zinc-300">
                          <td className="p-2 bg-zinc-100 font-bold">Jatuh Tempo:</td>
                          <td className="p-2 font-bold">{transaction.dueDate}</td>
                        </tr>
                        <tr className="border-b border-zinc-300">
                          <td className="p-2 bg-zinc-100 font-bold">Jaminan yang Dititipkan:</td>
                          <td className="p-2 font-bold">{transaction.guarantee}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-[10px] text-zinc-600 bg-zinc-50 p-2.5 rounded border border-zinc-200">
                <span className="font-bold text-zinc-900 block">KETENTUAN & GARANSI:</span>
                <p>1. Kendaraan diserahkan dalam kondisi fisik dan mesin baik sebagaimana dicek bersama.</p>
                <p>2. Showroom Maharga Motor memberikan Garansi Mesin selama 30 Hari sejak tanggal serah terima.</p>
                <p>3. Keabsahan dokumen (STNK & BPKB) dijamin 100% legal dan bebas masalah hukum.</p>
              </div>

              <div className="pt-6 grid grid-cols-2 text-center gap-8">
                <div>
                  <p className="text-zinc-600 mb-12">Pihak Kedua (Pembeli)</p>
                  <p className="font-bold text-zinc-900 underline">( {transaction.buyerName} )</p>
                </div>
                <div>
                  <p className="text-zinc-600 mb-12">Pihak Pertama (Maharga Motor)</p>
                  <p className="font-bold text-zinc-900 underline">( {transaction.salesName} )</p>
                </div>
              </div>
            </div>
          )}

          {/* Kwitansi */}
          {docType === 'kwitansi' && (
            <div className="space-y-5 text-xs text-zinc-800">
              <div className="text-center space-y-0.5">
                <h2 className="text-sm font-black uppercase underline tracking-wide">
                  KWITANSI RESMI PEMBAYARAN
                </h2>
                <p className="text-[10px] text-zinc-500 font-mono">KWT/{transaction.id}/2026</p>
              </div>

              <div className="space-y-2.5 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                <div className="flex border-b border-zinc-200 pb-2">
                  <span className="w-1/3 text-zinc-600">Telah Diterima Dari:</span>
                  <span className="font-bold text-zinc-900">{transaction.buyerName} ({transaction.buyerPhone})</span>
                </div>
                <div className="flex border-b border-zinc-200 pb-2">
                  <span className="w-1/3 text-zinc-600">Jumlah Uang:</span>
                  <span className="font-bold text-emerald-800 text-sm font-mono">
                    {formatIDR(transaction.paymentMethod === 'dp-tempo' ? transaction.dpAmount : transaction.dealPrice)}
                  </span>
                </div>
                <div className="flex border-b border-zinc-200 pb-2">
                  <span className="w-1/3 text-zinc-600">Untuk Pembayaran:</span>
                  <span className="font-medium text-zinc-900">
                    {transaction.paymentMethod === 'dp-tempo' ? 'Titip DP / Uang Muka Unit' : 'Pelunasan Pembelian Unit'}{' '}
                    <strong>{transaction.unitName} (Plat: {transaction.plate})</strong>
                  </span>
                </div>
                {transaction.paymentMethod === 'dp-tempo' && (
                  <div className="flex border-b border-zinc-200 pb-2">
                    <span className="w-1/3 text-zinc-600">Sisa Pelunasan:</span>
                    <span className="font-bold text-rose-800 font-mono">{formatIDR(transaction.remainingAmount)} (Jatuh Tempo: {transaction.dueDate})</span>
                  </div>
                )}
              </div>

              <div className="pt-6 flex justify-end">
                <div className="text-center w-56 space-y-1">
                  <p className="text-zinc-600">Surakarta, {transaction.date}</p>
                  <p className="text-zinc-600 font-semibold mb-12">Kasir / Penerima,</p>
                  <p className="font-bold text-zinc-900 underline">( {transaction.salesName} )</p>
                  <span className="text-[10px] text-zinc-500">Maharga Motor Official</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
