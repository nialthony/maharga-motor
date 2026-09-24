import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  Layers, 
  Video, 
  MessageCircle, 
  Download,
  Hash,
  Wand2
} from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function MarketingAutomation({ units, selectedUnit, setSelectedUnit }) {
  const [activeChannel, setActiveChannel] = useState('fb'); // 'fb' | 'tiktok' | 'wa'
  const [copiedKey, setCopiedKey] = useState(null);

  const currentUnit = selectedUnit || units.find(u => u.status === 'Tersedia') || units[0];

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fbTitles = {
    formal: `${currentUnit.brand.toUpperCase()} ${currentUnit.model.toUpperCase()} ${currentUnit.year} ORISINIL PAJAK ${currentUnit.taxStatus.toUpperCase()}`,
    direct: `Dijual ${currentUnit.model} Tahun ${currentUnit.year} Warna ${currentUnit.color} Siap Pakai`,
    promo: `[READY SHOWROOM] ${currentUnit.model} ${currentUnit.year} Mulus Bergaransi - Nego Sopan`,
    short: `${currentUnit.model} ${currentUnit.year} Plat ${currentUnit.plate.split(' ')[0]} ${currentUnit.color}`
  };

  const fbDescription = `
BISMILLAH, DIJUAL UNIT SHOWROOM MAHARGA MOTOR

SPESIFIKASI MOTOR:
• Merk / Tipe: ${currentUnit.brand} ${currentUnit.model}
• Tahun: ${currentUnit.year}
• Warna: ${currentUnit.color}
• Odometer: ${currentUnit.odometer.toLocaleString('id-ID')} KM
• Plat: ${currentUnit.plate}

KELENGKAPAN SURAT:
• ${currentUnit.documents.join(' + ')} Lengkap dan Asli
• Status Pajak: ${currentUnit.taxStatus} ${currentUnit.taxStatus === 'Hidup' ? `(Tertib s/d ${currentUnit.taxValidUntil})` : `(Off ${currentUnit.taxDeadYears} thn)`}
• Nomor Rangka & Mesin Akur

KONDISI KENDARAAN:
• ${currentUnit.condition}
• Mesin kering halus standar pabrik, kelistrikan normal
• Lolos uji QC bengkel Maharga Motor

SKEMA PEMBAYARAN:
• Harga Display: ${formatIDR(currentUnit.displayPrice)} (Nego di Lokasi)
• Pembayaran: Cash Tunai / Transfer Bank / Titip DP (Cash-Tempo)
• Garansi Mesin Showroom 1 Bulan Penuh!

LOKASI SHOWROOM MAHARGA MOTOR:
Silakan cek unit dan test drive langsung di showroom.
Chat WhatsApp atau Inbox untuk janjian cek unit.
`.trim();

  const tiktokScript = `
[DETIK 00-03 - HOOK]
"Cari ${currentUnit.model} yang beneran orisinil dan tinggal gas tanpa dandan? Nih tonton dulu sampai selesai!"

[DETIK 04-09 - VALUE & SPESIFIKASI]
"${currentUnit.brand} ${currentUnit.model} tahun ${currentUnit.year} warna ${currentUnit.color}. KM masih ${currentUnit.odometer.toLocaleString('id-ID')} ribu, mesin kering halus, dan pajaknya ${currentUnit.taxStatus.toLowerCase()}! Surat-surat STNK BPKB komplit terjamin keabsahannya."

[DETIK 10-15 - CTA & HARGA]
"Buka harga cuma ${formatIDR(currentUnit.displayPrice)} dan masih bisa nego sopan di tempat. Pembayaran bisa Cash Tunai, Transfer, atau Titip DP. Cek bio sekarang untuk alamat showroom Maharga Motor!"
`.trim();

  const tiktokHashtags = `#motorbekas #jualbelimotor #${currentUnit.brand.toLowerCase()} #${currentUnit.model.toLowerCase().replace(/\s+/g, '')} #motorsecond #mahargamotor #soloraya #motorbekasberkualitas`;

  const waTemplate = `
*MAHARGA MOTOR - STOK READY* 🏍️

Ready unit *${currentUnit.brand} ${currentUnit.model} (${currentUnit.year})*

📋 *Spesifikasi & Dokumen:*
• Nopol: *${currentUnit.plate}*
• Warna: *${currentUnit.color}*
• Odometer: *${currentUnit.odometer.toLocaleString('id-ID')} km*
• Pajak: *${currentUnit.taxStatus}*
• Surat: *${currentUnit.documents.join(', ')}* (Garansi Keabsahan 100%)
• Kondisi: _${currentUnit.condition}_

💰 *Harga Display:* *${formatIDR(currentUnit.displayPrice)}* _(Nego langsung di lokasi)_
💳 *Metode:* Cash Tunai / Transfer Bank / Titip DP

📍 *Lokasi Showroom:*
*MAHARGA MOTOR*

Mau foto/video detail atau cek suara mesin?
Silakan balas pesan ini. 🙏
`.trim();

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Marketing Content Generator (FB & TikTok)
          </h2>
          <p className="text-xs text-zinc-400">
            Generate copywriting iklan terstruktur untuk Facebook Marketplace, script video TikTok, dan format broadcast WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400 font-medium">Unit:</label>
          <select
            value={currentUnit.id}
            onChange={(e) => {
              const found = units.find(u => u.id === Number(e.target.value));
              if (found) setSelectedUnit(found);
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-bold focus:outline-none focus:border-amber-400"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                [{u.plate}] {u.brand} {u.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Channel Switcher */}
      <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-fit gap-1">
        <button
          onClick={() => setActiveChannel('fb')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeChannel === 'fb' ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Facebook Marketplace
        </button>
        <button
          onClick={() => setActiveChannel('tiktok')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeChannel === 'tiktok' ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          TikTok Video & Carousel
        </button>
        <button
          onClick={() => setActiveChannel('wa')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeChannel === 'wa' ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          WhatsApp Pro
        </button>
      </div>

      {/* FB Content */}
      {activeChannel === 'fb' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {/* Title Presets */}
            <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                Pilihan Judul FB Marketplace
              </h3>
              <div className="space-y-2">
                {Object.entries(fbTitles).map(([type, title]) => (
                  <div key={type} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block">{type}</span>
                      <span className="font-semibold text-zinc-200">{title}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(title, `title-${type}`)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors shrink-0 ${
                        copiedKey === `title-${type}` ? 'bg-emerald-500 text-zinc-950 font-bold' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                    >
                      {copiedKey === `title-${type}` ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                  Format Deskripsi Lengkap
                </h3>
                <button
                  onClick={() => handleCopy(fbDescription, 'desc-fb')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    copiedKey === 'desc-fb' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                  }`}
                >
                  {copiedKey === 'desc-fb' ? 'Tersalin!' : 'Salin Deskripsi'}
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto">
                {fbDescription}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3 text-xs">
              <h3 className="font-bold text-zinc-200 uppercase tracking-wider text-[11px]">Checklist FB Marketplace</h3>
              <ul className="space-y-2 text-zinc-400 list-disc list-inside">
                <li>Gunakan foto tampak depan dengan sudut 45 derajat.</li>
                <li>Pilih kategori: <strong>Kendaraan &gt; Sepeda Motor</strong>.</li>
                <li>Tetapkan lokasi showroom: radius 25-35 km.</li>
              </ul>

              <a
                href="https://www.facebook.com/marketplace/create/vehicle"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka FB Marketplace
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TikTok Content */}
      {activeChannel === 'tiktok' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-pink-400" />
                  Script Narasi Voiceover 15 Detik
                </h3>
                <button
                  onClick={() => handleCopy(tiktokScript, 'script-tt')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    copiedKey === 'script-tt' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                  }`}
                >
                  {copiedKey === 'script-tt' ? 'Tersalin!' : 'Salin Script'}
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 font-sans text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                {tiktokScript}
              </div>
            </div>

            <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Skema 4 Slide Carousel</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-amber-400 font-mono font-bold block">SLIDE 1</span>
                  <p className="font-bold text-zinc-200">Foto Depan (Cover)</p>
                  <p className="text-[10px] text-zinc-500">Mulus & orisinil</p>
                </div>
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-amber-400 font-mono font-bold block">SLIDE 2</span>
                  <p className="font-bold text-zinc-200">Speedometer</p>
                  <p className="text-[10px] text-zinc-500">KM asli {currentUnit.odometer.toLocaleString('id-ID')} km</p>
                </div>
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-amber-400 font-mono font-bold block">SLIDE 3</span>
                  <p className="font-bold text-zinc-200">Surat & Pajak</p>
                  <p className="text-[10px] text-zinc-500">STNK + BPKB</p>
                </div>
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-amber-400 font-mono font-bold block">SLIDE 4</span>
                  <p className="font-bold text-zinc-200">Harga & Lokasi</p>
                  <p className="text-[10px] text-zinc-500">{formatIDR(currentUnit.displayPrice)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-pink-400" /> Hashtag Rekomendasi
                </h3>
                <button
                  onClick={() => handleCopy(tiktokHashtags, 'hash')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  Salin
                </button>
              </div>
              <p className="p-2.5 rounded bg-zinc-950 font-mono text-xs text-zinc-400 leading-relaxed border border-zinc-800">
                {tiktokHashtags}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Content */}
      {activeChannel === 'wa' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Format Chat WhatsApp
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(waTemplate, 'wa-text')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      copiedKey === 'wa-text' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                    }`}
                  >
                    {copiedKey === 'wa-text' ? 'Tersalin' : 'Salin Teks'}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(waTemplate)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Kirim ke WA
                  </a>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                {waTemplate}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-2.5 text-xs text-zinc-400">
              <h3 className="font-bold text-zinc-200 uppercase tracking-wider text-[11px]">Tips Respon Konsumen</h3>
              <p>1. Kirimkan video singkat suara mesin jika calon pembeli ragu.</p>
              <p>2. Ajak test drive langsung di showroom Maharga Motor.</p>
              <p>3. Konfirmasikan bahwa pembayaran hanya via Tunai/Transfer atau Titip DP bertempo.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
