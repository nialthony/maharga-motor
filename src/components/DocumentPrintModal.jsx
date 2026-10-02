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

      // Collect all active stylesheets and style tags from current page so Tailwind & fonts carry over
      const currentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(el => el.outerHTML)
        .join('\n');

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${docType === 'spk' ? 'SPK' : 'Kwitansi_Nota'} - ${transaction.plate || transaction.id}</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap">
            ${currentStyles}
            <style>
              @page {
                size: A4 portrait;
                margin: 12mm 18mm;
              }
              *, *::before, *::after {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                font-family: 'Segoe UI', 'Plus Jakarta Sans', Arial, -apple-system, sans-serif !important;
                color: #111827 !important;
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                font-size: 12px !important;
                line-height: 1.45 !important;
                width: 100% !important;
              }
              .doc-wrapper {
                margin: 0 !important;
                padding: 0 !important;
                position: relative !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                background: #ffffff !important;
              }
              /* Explicit styles ensuring print layout never collapses */
              .nota-flex { display: flex !important; }
              .nota-justify-between { justify-content: space-between !important; }
              .nota-justify-end { justify-content: flex-end !important; }
              .nota-items-start { align-items: flex-start !important; }
              .nota-items-end { align-items: flex-end !important; }
              .nota-items-center { align-items: center !important; }
              .nota-text-center { text-align: center !important; }
              .nota-text-right { text-align: right !important; }
              .nota-w-full { width: 100% !important; }
              .nota-grid-2 { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
              .nota-table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #d4d4d8 !important; }
              .nota-table th, .nota-table td { border: 1px solid #d4d4d8 !important; }
              .nota-watermark {
                position: absolute !important;
                left: 50% !important;
                top: 50% !important;
                transform: translate(-50%, -50%) rotate(-18deg) !important;
                pointer-events: none !important;
                user-select: none !important;
                font-size: 78px !important;
                font-weight: 900 !important;
                letter-spacing: 14px !important;
                padding: 8px 40px !important;
                border-radius: 16px !important;
                text-transform: uppercase !important;
                z-index: 0 !important;
              }
              .font-mono { font-family: 'JetBrains Mono', Courier, monospace !important; }
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

      // Wait for images inside iframe to complete before triggering print
      const triggerPrint = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }, 150);
      };

      const imgs = iframe.contentWindow?.document.images;
      if (imgs && imgs.length > 0) {
        let loaded = 0;
        const total = imgs.length;
        const onDone = () => {
          loaded++;
          if (loaded >= total) triggerPrint();
        };
        for (let i = 0; i < total; i++) {
          if (imgs[i].complete) {
            loaded++;
          } else {
            imgs[i].onload = onDone;
            imgs[i].onerror = onDone;
          }
        }
        if (loaded >= total) {
          triggerPrint();
        }
      } else {
        triggerPrint();
      }
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
          {/* FORMAT KWITANSI PENJUALAN MATCHING anti-slop/Nota_T 6430 RA.pdf */}
          {/* Menggunakan Logo.png awal showroom di Kop Surat */}
          {/* ======================================================== */}
          {docType === 'kwitansi' && (
            <div className="relative text-zinc-900 font-sans" style={{ minHeight: '640px', position: 'relative' }}>
              
              {/* WATERMARK STAMP "LUNAS" / "TEMPO" */}
              <div 
                className="nota-watermark pointer-events-none select-none"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '52%',
                  transform: 'translate(-50%, -50%) rotate(-18deg)',
                  border: isTempo ? '5px solid rgba(217, 119, 6, 0.18)' : '5px solid rgba(16, 185, 129, 0.18)',
                  color: isTempo ? 'rgba(217, 119, 6, 0.16)' : 'rgba(16, 185, 129, 0.16)',
                  fontSize: '78px',
                  fontWeight: 900,
                  letterSpacing: '14px',
                  padding: '8px 40px',
                  borderRadius: '16px',
                  textTransform: 'uppercase',
                  zIndex: 0
                }}
              >
                {isTempo ? 'TEMPO' : 'LUNAS'}
              </div>

              {/* KOP SURAT (HEADER DENGAN LOGO.PNG AWAL MAHARGA MOTOR) */}
              <div style={{ position: 'relative', zIndex: 1, marginBottom: '22px' }}>
                <div 
                  className="nota-flex nota-justify-between nota-items-end" 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '12px' }}
                >
                  <div>
                    <img 
                      src="/logo.png" 
                      alt="Maharga Motor" 
                      style={{ height: '52px', width: 'auto', objectFit: 'contain', display: 'block', marginBottom: '8px' }} 
                    />
                    <p style={{ fontSize: '11px', color: '#374151', margin: 0, lineHeight: 1.45 }}>
                      Jl. Ponggok - Krajan KM.1, Ds Tombol Rt 09/10, Ds. Dalangan, Kec. Tulung, Kab. Klaten
                    </p>
                    <p style={{ fontSize: '11px', color: '#111827', margin: '2px 0 0 0', fontWeight: 600 }}>
                      WhatsApp: 0821-3564-1774
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.8px', display: 'block' }}>
                      Showroom Resmi
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>
                      Pusat Jual Beli Motor Bekas
                    </span>
                  </div>
                </div>

                {/* SOLID 3PX DIVIDER BAR (MATCHING NOTA PDF) */}
                <div style={{ width: '100%', height: '3px', backgroundColor: '#18181b', marginTop: '6px' }}></div>
              </div>

              {/* TITLE: KWITANSI PENJUALAN & NOMOR TRANSAKSI */}
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '22px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#111827', margin: '0 0 4px 0' }}>
                  KWITANSI PENJUALAN
                </h2>
                {/* 2PX SOLID CENTERED UNDERLINE */}
                <div style={{ width: '260px', height: '2px', backgroundColor: '#18181b', margin: '0 auto 6px auto' }}></div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0 }}>
                  No. Transaksi: <strong style={{ color: '#111827' }}>{invoiceNumber}</strong>
                </p>
              </div>

              {/* DUA KOLOM: INFORMASI PEMBELI & DETAIL PENJUALAN */}
              <div 
                className="nota-grid-2" 
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', fontSize: '12px', marginBottom: '22px', position: 'relative', zIndex: 1 }}
              >
                {/* Kolom Kiri: INFORMASI PEMBELI */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ borderBottom: '1px solid #d4d4d8', paddingBottom: '4px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#111827' }}>
                      INFORMASI PEMBELI
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', textTransform: 'uppercase' }}>
                    {transaction.buyerName || 'PARJANTO'}
                  </div>
                  <div style={{ color: '#374151', lineHeight: 1.4 }}>
                    Alamat: {transaction.buyerAddress || 'Karangasem 01/05, Sraten, Gatak, Sukoharjo'}
                  </div>
                  <div style={{ color: '#374151' }}>
                    WhatsApp: {transaction.buyerPhone || '085750886535'}
                  </div>
                </div>

                {/* Kolom Kanan: DETAIL PENJUALAN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                  <div style={{ borderBottom: '1px solid #d4d4d8', paddingBottom: '4px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#111827' }}>
                      DETAIL PENJUALAN
                    </span>
                  </div>
                  <div style={{ color: '#374151' }}>
                    Tanggal: <span style={{ fontWeight: 600, color: '#111827' }}>{formatDate(transaction.date)}</span>
                  </div>
                  <div style={{ color: '#374151' }}>
                    Sales: <strong style={{ color: '#111827' }}>{transaction.salesName || 'Adi Wibakso'}</strong>
                  </div>
                  <div style={{ color: '#374151' }}>
                    Metode: <strong style={{ color: '#111827', textTransform: 'uppercase' }}>{displayPaymentMethod}</strong>
                  </div>
                </div>
              </div>

              {/* TABEL UNIT KENDARAAN (MATCHING EXACT TABLE anti-slop/Nota_T 6430 RA.pdf) */}
              <div style={{ position: 'relative', zIndex: 1, marginBottom: '14px' }}>
                <table 
                  className="nota-table" 
                  style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d4d4d8', fontSize: '12px' }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #d4d4d8' }}>
                      <th style={{ padding: '8px 12px', fontWeight: 700, color: '#111827', textAlign: 'left', borderRight: '1px solid #d4d4d8', width: '50%' }}>
                        Deskripsi Unit Kendaraan
                      </th>
                      <th style={{ padding: '8px 12px', fontWeight: 700, color: '#111827', textAlign: 'center', borderRight: '1px solid #d4d4d8', width: '25%' }}>
                        No. Polisi
                      </th>
                      <th style={{ padding: '8px 12px', fontWeight: 700, color: '#111827', textAlign: 'right', width: '25%' }}>
                        Harga Deal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', borderRight: '1px solid #d4d4d8' }}>
                        <div style={{ fontWeight: 800, color: '#111827', fontSize: '13px' }}>
                          {transaction.unitName || 'Yamaha NMAX'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                          Warna : {transaction.color || 'Biru'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'center', fontWeight: 800, color: '#111827', fontSize: '13px', fontFamily: "'JetBrains Mono', Courier, monospace", borderRight: '1px solid #d4d4d8' }}>
                        {transaction.plate || 'T 6430 RA'}
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right', fontWeight: 800, color: '#111827', fontSize: '13px', fontFamily: "'JetBrains Mono', Courier, monospace' " }}>
                        Rp {formatIDR(dealPrice)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* TOTAL SUMMARY SECTION (RIGHT ALIGNED UNDER TABLE) */}
                <div 
                  className="nota-flex nota-justify-end" 
                  style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', fontSize: '12px' }}
                >
                  <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                      <span>Total Harga Deal</span>
                      <span style={{ fontWeight: 700, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>Rp {formatIDR(dealPrice)}</span>
                    </div>

                    {isTempo ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                          <span>Jumlah Titip DP</span>
                          <span style={{ fontWeight: 700, color: '#047857', fontFamily: "'JetBrains Mono', monospace" }}>Rp {formatIDR(dpAmount)}</span>
                        </div>
                        <div style={{ width: '100%', height: '2px', backgroundColor: '#18181b', margin: '4px 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '14px', color: '#b91c1c' }}>
                          <span>SISA TAGIHAN</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Rp {formatIDR(remainingAmount)}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right', paddingTop: '2px' }}>
                          Jatuh Tempo: {formatDate(transaction.dueDate)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ width: '100%', height: '2px', backgroundColor: '#18181b', margin: '4px 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '15px', color: '#111827' }}>
                          <span>TOTAL LUNAS</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Rp {formatIDR(dealPrice)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* TANDA TANGAN (SIGNATURES) */}
              <div 
                className="nota-grid-2" 
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', fontSize: '12px', paddingTop: '45px', position: 'relative', zIndex: 1 }}
              >
                <div>
                  <p style={{ color: '#4b5563', margin: 0 }}>Hormat Kami (Kasir),</p>
                  <div style={{ height: '70px' }}></div>
                  <p style={{ fontWeight: 800, color: '#111827', textTransform: 'uppercase', margin: 0 }}>
                    ( ADMIN MAHARGA )
                  </p>
                </div>
                <div>
                  <p style={{ color: '#4b5563', margin: 0 }}>Pembeli,</p>
                  <div style={{ height: '70px' }}></div>
                  <p style={{ fontWeight: 800, color: '#111827', textTransform: 'uppercase', margin: 0 }}>
                    ( {transaction.buyerName || 'PARJANTO'} )
                  </p>
                </div>
              </div>

              {/* FOOTER NOTE DENGAN GARIS TITIK-TITIK */}
              <div style={{ paddingTop: '35px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '100%', borderTop: '1px dotted #9ca3af', marginBottom: '10px' }}></div>
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', fontStyle: 'italic', margin: 0 }}>
                  Kwitansi ini adalah bukti pembayaran yang sah. Terima kasih atas pembelian Anda di Maharga Motor.
                </p>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* FORMAT SURAT PERJANJIAN KENDARAAN (SPK) */}
          {/* ======================================================== */}
          {docType === 'spk' && (
            <div className="space-y-4 text-xs text-zinc-800 font-sans" style={{ minHeight: '640px' }}>
              {/* Header SPK dengan Logo.png */}
              <div 
                className="nota-flex nota-justify-between nota-items-end" 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #18181b', paddingBottom: '12px', marginBottom: '20px' }}
              >
                <div>
                  <img 
                    src="/logo.png" 
                    alt="Maharga Motor" 
                    style={{ height: '48px', width: 'auto', objectFit: 'contain', display: 'block', marginBottom: '6px' }} 
                  />
                  <p style={{ fontSize: '11px', color: '#4b5563', margin: 0, fontWeight: 500 }}>
                    Pusat Jual Beli Sepeda Motor Bekas Berkualitas & Bergaransi
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>
                    Jl. Ponggok - Krajan KM.1, Ds Tombol, Dalangan, Tulung, Klaten • WA: 0821-3564-1774
                  </p>
                </div>

                <div style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f4f4f5', color: '#18181b', fontWeight: 700, fontSize: '12px', border: '1px solid #d4d4d8', display: 'inline-block' }}>
                    {transaction.id}
                  </span>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0 0' }}>Tgl: {formatDate(transaction.date)}</p>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', textDecoration: 'underline', letterSpacing: '0.5px', margin: 0 }}>
                  SURAT PERJANJIAN JUAL BELI & SERAH TERIMA KENDARAAN (SPK)
                </h2>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '2px 0 0 0' }}>Nomor: SPK/{transaction.id}/MM/2026</p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid #e4e4e7', paddingBottom: '2px', marginBottom: '6px' }}>I. PIHAK TERKAIT</h3>
                <div className="nota-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#fafafa', borderRadius: '6px', border: '1px solid #e4e4e7' }}>
                    <span style={{ fontWeight: 700, display: 'block', fontSize: '10px', color: '#6b7280' }}>PENJUAL:</span>
                    <p style={{ fontWeight: 700, margin: '2px 0' }}>Showroom Maharga Motor</p>
                    <p style={{ margin: 0 }}>Sales: {transaction.salesName || 'Staff Sales'}</p>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#fafafa', borderRadius: '6px', border: '1px solid #e4e4e7' }}>
                    <span style={{ fontWeight: 700, display: 'block', fontSize: '10px', color: '#6b7280' }}>PEMBELI:</span>
                    <p style={{ fontWeight: 700, margin: '2px 0' }}>{transaction.buyerName || '-'}</p>
                    <p style={{ margin: 0 }}>HP: {transaction.buyerPhone || '-'}</p>
                    <p style={{ margin: 0 }}>Alamat: {transaction.buyerAddress || '-'}</p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid #e4e4e7', paddingBottom: '2px', marginBottom: '6px' }}>II. DETAIL OBJEK KENDARAAN</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d4d4d8', textAlign: 'left' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #d4d4d8' }}>
                      <td style={{ padding: '8px', backgroundColor: '#f4f4f5', fontWeight: 700, width: '35%' }}>Tipe / Merk:</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{transaction.unitName}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #d4d4d8' }}>
                      <td style={{ padding: '8px', backgroundColor: '#f4f4f5', fontWeight: 700 }}>Nomor Polisi:</td>
                      <td style={{ padding: '8px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#92400e' }}>{transaction.plate}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #d4d4d8' }}>
                      <td style={{ padding: '8px', backgroundColor: '#f4f4f5', fontWeight: 700 }}>Harga Kesepakatan:</td>
                      <td style={{ padding: '8px', fontWeight: 700, color: '#047857', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace" }}>{formatIDR(dealPrice)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #d4d4d8' }}>
                      <td style={{ padding: '8px', backgroundColor: '#f4f4f5', fontWeight: 700 }}>Metode Pembayaran:</td>
                      <td style={{ padding: '8px', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', fontWeight: 700 }}>{displayPaymentMethod}</td>
                    </tr>
                    {isTempo && (
                      <>
                        <tr style={{ borderBottom: '1px solid #d4d4d8' }}>
                          <td style={{ padding: '8px', backgroundColor: '#f4f4f5', fontWeight: 700 }}>Uang Muka (DP Masuk):</td>
                          <td style={{ padding: '8px', fontWeight: 700, color: '#047857', fontFamily: "'JetBrains Mono', monospace" }}>{formatIDR(dpAmount)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #d4d4d8' }}>
                          <td style={{ padding: '8px', backgroundColor: '#f4f4f5', fontWeight: 700 }}>Sisa Pelunasan:</td>
                          <td style={{ padding: '8px', fontWeight: 700, color: '#b91c1c', fontFamily: "'JetBrains Mono', monospace" }}>{formatIDR(remainingAmount)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #d4d4d8' }}>
                          <td style={{ padding: '8px', backgroundColor: '#f4f4f5', fontWeight: 700 }}>Jatuh Tempo:</td>
                          <td style={{ padding: '8px', fontWeight: 700 }}>{formatDate(transaction.dueDate)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #d4d4d8' }}>
                          <td style={{ padding: '8px', backgroundColor: '#f4f4f5', fontWeight: 700 }}>Jaminan yang Dititipkan:</td>
                          <td style={{ padding: '8px', fontWeight: 700 }}>{transaction.guarantee || '-'}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ fontSize: '10px', color: '#4b5563', backgroundColor: '#fafafa', padding: '10px', borderRadius: '6px', border: '1px solid #e4e4e7', marginBottom: '20px' }}>
                <span style={{ fontWeight: 700, color: '#111827', display: 'block', marginBottom: '2px' }}>KETENTUAN & GARANSI:</span>
                <p style={{ margin: '1px 0' }}>1. Kendaraan diserahkan dalam kondisi fisik dan mesin baik sebagaimana dicek bersama.</p>
                <p style={{ margin: '1px 0' }}>2. Showroom Maharga Motor memberikan Garansi Mesin selama 30 Hari sejak tanggal serah terima.</p>
                <p style={{ margin: '1px 0' }}>3. Keabsahan dokumen (STNK & BPKB) dijamin 100% legal dan bebas masalah hukum.</p>
              </div>

              <div className="nota-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', paddingTop: '20px' }}>
                <div>
                  <p style={{ color: '#4b5563', margin: 0 }}>Pihak Kedua (Pembeli)</p>
                  <div style={{ height: '50px' }}></div>
                  <p style={{ fontWeight: 800, color: '#111827', textDecoration: 'underline', margin: 0 }}>( {transaction.buyerName || 'PEMBELI'} )</p>
                </div>
                <div>
                  <p style={{ color: '#4b5563', margin: 0 }}>Pihak Pertama (Maharga Motor)</p>
                  <div style={{ height: '50px' }}></div>
                  <p style={{ fontWeight: 800, color: '#111827', textDecoration: 'underline', margin: 0 }}>( {transaction.salesName || 'ADMIN MAHARGA'} )</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
