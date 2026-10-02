import React, { useState } from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function DocumentPrintModal({ transaction, onClose }) {
  // Default to 'kwitansi' matching anti-slop/Nota_T 6430 RA.pdf
  const [docType, setDocType] = useState('kwitansi'); // 'kwitansi' | 'spk'

  if (!transaction) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '01/10/2026';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const invoiceNumber = transaction.invoiceNo || 
    (transaction.id?.startsWith('#') ? transaction.id : 
     transaction.id?.startsWith('INV-') ? `#${transaction.id}` : 
     transaction.id?.startsWith('TX-') ? `#INV-${transaction.id.replace('TX-', '')}` : 
     `#INV-${transaction.id || '01369'}`);

  const isTempo = transaction.paymentMethod === 'dp-tempo';
  const displayPaymentMethod = isTempo 
    ? 'TEMPO' 
    : (transaction.paymentMethod ? transaction.paymentMethod.toUpperCase() : 'CASH');

  const dealPrice = Number(transaction.dealPrice) || 0;
  const dpAmount = Number(transaction.dpAmount) || dealPrice;
  const remainingAmount = Number(transaction.remainingAmount) || (isTempo ? Math.max(0, dealPrice - dpAmount) : 0);

  const handlePrint = () => {
    const printableElement = document.getElementById('printable-document');
    if (!printableElement) {
      window.print();
      return;
    }

    try {
      // Create isolated printing iframe with actual A4 dimensions positioned off-screen
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        return;
      }

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${docType === 'spk' ? 'SPK' : 'Kwitansi_Nota'} - ${transaction.plate || transaction.id}</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap">
            <style>
              @page {
                size: A4 portrait;
                margin: 12mm 18mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                font-family: 'Segoe UI', 'Plus Jakarta Sans', Arial, -apple-system, sans-serif;
                color: #18181b;
                background: #ffffff;
                margin: 0;
                padding: 0;
                font-size: 12px;
                line-height: 1.45;
              }
              .doc-wrapper {
                margin: 0;
                padding: 0;
                position: relative;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .font-mono { font-family: 'JetBrains Mono', Courier, monospace; }
              .font-bold { font-weight: 700; }
              .font-black { font-weight: 900; }
              .font-semibold { font-weight: 600; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .uppercase { text-transform: uppercase; }
              .underline { text-decoration: underline; }
              table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 6px; }
              td, th { border: 1px solid #d4d4d8; padding: 7px 10px; font-size: 12px; }
              .grid { display: flex; gap: 24px; }
              .grid-cols-2 > div { flex: 1; }
              img { max-height: 65px; width: auto; }
            </style>
          </head>
          <body>
            <div class="doc-wrapper">
              ${printableElement.innerHTML}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 350);
    } catch {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[92vh]">
        {/* Top Controls */}
        <div className="p-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              onClick={() => setDocType('kwitansi')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                docType === 'kwitansi' 
                  ? 'bg-amber-500 text-zinc-950 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Kwitansi Penjualan (Nota)</span>
            </button>
            <button
              onClick={() => setDocType('spk')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                docType === 'spk' 
                  ? 'bg-amber-500 text-zinc-950 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Surat Perjanjian (SPK)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Tutup pratinjau dokumen"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="p-6 sm:p-10 bg-white text-zinc-900 font-sans overflow-y-auto flex-1 select-text" id="printable-document">
          
          {/* ======================================================== */}
          {/* FORMAT KWITANSI PENJUALAN 1:1 MATCHING anti-slop/Nota_T 6430 RA.pdf */}
          {/* ======================================================== */}
          {docType === 'kwitansi' && (
            <div className="relative space-y-6 text-zinc-900 font-sans" style={{ minHeight: '620px' }}>
              
              {/* WATERMARK STAMP "LUNAS" / "TEMPO" */}
              <div 
                className="pointer-events-none select-none absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 -rotate-[18deg] z-0"
                style={{
                  border: isTempo ? '5px solid rgba(217, 119, 6, 0.18)' : '5px solid rgba(16, 185, 129, 0.18)',
                  color: isTempo ? 'rgba(217, 119, 6, 0.16)' : 'rgba(16, 185, 129, 0.16)',
                  fontSize: '78px',
                  fontWeight: 900,
                  letterSpacing: '14px',
                  padding: '8px 40px',
                  borderRadius: '16px',
                  textTransform: 'uppercase'
                }}
              >
                {isTempo ? 'TEMPO' : 'LUNAS'}
              </div>

              {/* KOP SURAT (HEADER MAHARGA MOTOR) */}
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#D32F2F', fontFamily: "'Segoe UI', sans-serif" }}>
                      MAHARGA MOTOR
                    </h1>
                    <p className="text-xs text-zinc-700 font-normal mt-0.5 max-w-md leading-relaxed">
                      Jl. Ponggok - Krajan KM.1, Ds Tombol Rt 09/10, Ds. Dalangan, Kec. Tulung, Kab. Klaten
                    </p>
                    <p className="text-xs text-zinc-700 font-normal mt-0.5">
                      WA: 0821-3564-1774
                    </p>
                  </div>
                  <div className="shrink-0 pl-4">
                    <img 
                      src="/kwitansi_logo.png" 
                      alt="Maharga Motor Logo" 
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                </div>

                {/* SOLID 3PX DIVIDER BAR (MATCHING 38 119 718 3 re in PDF) */}
                <div className="w-full h-[3px] bg-zinc-900 mt-3 mb-6"></div>
              </div>

              {/* TITLE: KWITANSI PENJUALAN & NOMOR TRANSAKSI */}
              <div className="relative z-10 text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-zinc-900">
                  KWITANSI PENJUALAN
                </h2>
                {/* 2PX SOLID CENTERED UNDERLINE */}
                <div className="w-64 h-[2px] bg-zinc-900 mx-auto"></div>
                <p className="text-sm font-semibold text-zinc-800 pt-0.5">
                  No. Transaksi: <span className="font-bold">{invoiceNumber}</span>
                </p>
              </div>

              {/* DUA KOLOM: INFORMASI PEMBELI & DETAIL PENJUALAN */}
              <div className="relative z-10 grid grid-cols-2 gap-8 text-xs pt-1">
                {/* Kolom Kiri: INFORMASI PEMBELI */}
                <div className="space-y-1.5">
                  <div className="border-b border-zinc-300 pb-1 mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                      INFORMASI PEMBELI
                    </h3>
                  </div>
                  <div className="font-bold text-sm text-zinc-900 uppercase">
                    {transaction.buyerName || 'PARJANTO'}
                  </div>
                  <div className="text-zinc-700 leading-snug">
                    Alamat: {transaction.buyerAddress || 'Karangasem 01/05, Sraten, Gatak, Sukoharjo'}
                  </div>
                  <div className="text-zinc-700">
                    WhatsApp: {transaction.buyerPhone || '085750886535'}
                  </div>
                </div>

                {/* Kolom Kanan: DETAIL PENJUALAN */}
                <div className="space-y-1.5 text-right">
                  <div className="border-b border-zinc-300 pb-1 mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                      DETAIL PENJUALAN
                    </h3>
                  </div>
                  <div className="text-zinc-700">
                    Tanggal: <span className="font-medium">{formatDate(transaction.date)}</span>
                  </div>
                  <div className="text-zinc-700">
                    Sales: <strong className="text-zinc-900">{transaction.salesName || 'Adi Wibakso'}</strong>
                  </div>
                  <div className="text-zinc-700">
                    Metode: <strong className="text-zinc-900 uppercase">{displayPaymentMethod}</strong>
                  </div>
                </div>
              </div>

              {/* TABEL UNIT KENDARAAN (MATCHING EXACT TABLE anti-slop/Nota_T 6430 RA.pdf) */}
              <div className="relative z-10 pt-2">
                <table className="w-full text-left border-collapse border border-zinc-300 text-xs">
                  <thead>
                    <tr className="border-b border-zinc-300 bg-zinc-50/50">
                      <th className="py-2.5 px-4 font-bold text-zinc-900 border-r border-zinc-300 w-1/2">
                        Deskripsi Unit Kendaraan
                      </th>
                      <th className="py-2.5 px-4 font-bold text-zinc-900 text-center border-r border-zinc-300 w-1/4">
                        No. Polisi
                      </th>
                      <th className="py-2.5 px-4 font-bold text-zinc-900 text-right w-1/4">
                        Harga Deal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-300">
                      <td className="py-3 px-4 border-r border-zinc-300 align-top">
                        <div className="font-bold text-zinc-900 text-sm">
                          {transaction.unitName || 'Yamaha NMAX'}
                        </div>
                        <div className="text-zinc-500 text-[11px] mt-0.5">
                          Warna : {transaction.color || 'Biru'}
                        </div>
                      </td>
                      <td className="py-3 px-4 border-r border-zinc-300 text-center align-top font-bold text-zinc-900 text-sm font-mono">
                        {transaction.plate || 'T 6430 RA'}
                      </td>
                      <td className="py-3 px-4 text-right align-top font-bold text-zinc-900 text-sm font-mono">
                        Rp {formatIDR(dealPrice)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* TOTAL SUMMARY SECTION (RIGHT ALIGNED UNDER TABLE) */}
                <div className="flex justify-end pt-3 text-xs">
                  <div className="w-72 space-y-1.5">
                    <div className="flex justify-between text-zinc-700">
                      <span>Total Harga Deal</span>
                      <span className="font-semibold text-zinc-900 font-mono">Rp {formatIDR(dealPrice)}</span>
                    </div>

                    {isTempo ? (
                      <>
                        <div className="flex justify-between text-zinc-700">
                          <span>Jumlah Titip DP</span>
                          <span className="font-semibold text-emerald-700 font-mono">Rp {formatIDR(dpAmount)}</span>
                        </div>
                        <div className="w-full h-[2px] bg-zinc-900 my-1"></div>
                        <div className="flex justify-between font-black text-sm text-rose-700">
                          <span>SISA TAGIHAN</span>
                          <span className="font-mono">Rp {formatIDR(remainingAmount)}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 text-right pt-0.5">
                          Jatuh Tempo: {formatDate(transaction.dueDate)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-full h-[2px] bg-zinc-900 my-1"></div>
                        <div className="flex justify-between font-black text-base text-zinc-950">
                          <span>TOTAL LUNAS</span>
                          <span className="font-mono">Rp {formatIDR(dealPrice)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* TANDA TANGAN (SIGNATURES) */}
              <div className="relative z-10 pt-10 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="text-zinc-700 font-normal">Hormat Kami (Kasir),</p>
                  <div className="h-20"></div>
                  <p className="font-bold text-zinc-900 uppercase">
                    ( ADMIN MAHARGA )
                  </p>
                </div>
                <div>
                  <p className="text-zinc-700 font-normal">Pembeli,</p>
                  <div className="h-20"></div>
                  <p className="font-bold text-zinc-900 uppercase">
                    ( {transaction.buyerName || 'PARJANTO'} )
                  </p>
                </div>
              </div>

              {/* FOOTER NOTE DENGAN GARIS TITIK-TITIK */}
              <div className="relative z-10 pt-8">
                <div className="w-full border-t border-dotted border-zinc-400 mb-3"></div>
                <p className="text-center text-[11px] text-zinc-500 italic">
                  Kwitansi ini adalah bukti pembayaran yang sah. Terima kasih atas pembelian Anda di Maharga Motor.
                </p>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* FORMAT SURAT PERJANJIAN KENDARAAN (SPK) */}
          {/* ======================================================== */}
          {docType === 'spk' && (
            <div className="space-y-4 text-xs text-zinc-800 font-sans">
              {/* Header SPK */}
              <div className="border-b-2 border-zinc-900 pb-3 mb-5 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight" style={{ color: '#D32F2F' }}>
                    MAHARGA MOTOR
                  </h1>
                  <p className="text-xs text-zinc-600 font-medium">
                    Pusat Jual Beli Sepeda Motor Bekas Berkualitas & Bergaransi
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Jl. Ponggok - Krajan KM.1, Ds Tombol, Dalangan, Tulung, Klaten • WA: 0821-3564-1774
                  </p>
                </div>

                <div className="text-right font-mono">
                  <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-bold text-xs border border-zinc-300">
                    {transaction.id}
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-1">Tgl: {formatDate(transaction.date)}</p>
                </div>
              </div>

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
                    <p>Sales: {transaction.salesName || 'Staff Sales'}</p>
                  </div>
                  <div className="p-2.5 bg-zinc-50 rounded border border-zinc-200">
                    <span className="font-bold block text-[10px] text-zinc-500">PEMBELI:</span>
                    <p className="font-bold">{transaction.buyerName || '-'}</p>
                    <p>HP: {transaction.buyerPhone || '-'}</p>
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
                      <td className="p-2 font-bold text-emerald-800 text-sm font-mono">{formatIDR(dealPrice)}</td>
                    </tr>
                    <tr className="border-b border-zinc-300">
                      <td className="p-2 bg-zinc-100 font-bold">Metode Pembayaran:</td>
                      <td className="p-2 font-mono uppercase font-bold">{displayPaymentMethod}</td>
                    </tr>
                    {isTempo && (
                      <>
                        <tr className="border-b border-zinc-300">
                          <td className="p-2 bg-zinc-100 font-bold">Uang Muka (DP Masuk):</td>
                          <td className="p-2 font-bold text-emerald-800 font-mono">{formatIDR(dpAmount)}</td>
                        </tr>
                        <tr className="border-b border-zinc-300">
                          <td className="p-2 bg-zinc-100 font-bold">Sisa Pelunasan:</td>
                          <td className="p-2 font-bold text-rose-800 font-mono">{formatIDR(remainingAmount)}</td>
                        </tr>
                        <tr className="border-b border-zinc-300">
                          <td className="p-2 bg-zinc-100 font-bold">Jatuh Tempo:</td>
                          <td className="p-2 font-bold">{formatDate(transaction.dueDate)}</td>
                        </tr>
                        <tr className="border-b border-zinc-300">
                          <td className="p-2 bg-zinc-100 font-bold">Jaminan yang Dititipkan:</td>
                          <td className="p-2 font-bold">{transaction.guarantee || '-'}</td>
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
                  <p className="font-bold text-zinc-900 underline">( {transaction.buyerName || 'PEMBELI'} )</p>
                </div>
                <div>
                  <p className="text-zinc-600 mb-12">Pihak Pertama (Maharga Motor)</p>
                  <p className="font-bold text-zinc-900 underline">( {transaction.salesName || 'ADMIN MAHARGA'} )</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
