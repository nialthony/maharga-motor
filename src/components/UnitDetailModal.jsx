import React from 'react';
import { 
  X, 
  Layers, 
  ShieldCheck, 
  DollarSign, 
  CreditCard, 
  Wrench
} from 'lucide-react';
import { formatIDR, calculateUnitEconomics } from '../data/mockData';

export default function UnitDetailModal({ unit, role, onClose, onOpenPOS }) {
  if (!unit) return null;

  const eco = calculateUnitEconomics(unit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
              {unit.plate}
            </span>
            <h3 className="text-sm font-bold text-zinc-100">{unit.brand} {unit.model} ({unit.year})</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-zinc-300">
          {/* Images */}
          <div className="grid grid-cols-2 gap-2.5">
            {unit.images.map((img, idx) => (
              <div key={idx} className="relative h-40 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800">
                <img src={img} alt={unit.model} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Specs & Documents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <h4 className="font-bold text-zinc-200 uppercase tracking-wider text-[10px]">Dokumen & Kondisi Fisik</h4>
              <div className="flex justify-between">
                <span className="text-zinc-500">Kelengkapan:</span>
                <span className="font-bold text-zinc-200">{unit.documents.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Pajak:</span>
                <span className={`font-bold ${unit.taxStatus === 'Hidup' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {unit.taxStatus} {unit.taxStatus === 'Hidup' ? `(s/d ${unit.taxValidUntil})` : `(Off ${unit.taxDeadYears} thn)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Odometer:</span>
                <span className="font-mono font-bold text-zinc-200">{unit.odometer.toLocaleString('id-ID')} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Warna:</span>
                <span className="text-zinc-200 font-semibold">{unit.color}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <h4 className="font-bold text-zinc-200 uppercase tracking-wider text-[10px]">Kebijakan Harga & Nego</h4>
              <div className="flex justify-between">
                <span className="text-zinc-500">Harga Display Iklan:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{formatIDR(unit.displayPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Batas Bawah Sales:</span>
                <span className="font-mono font-bold text-rose-400 text-sm">{formatIDR(eco.minPrice)}</span>
              </div>
              <p className="text-[11px] text-zinc-400 pt-1">
                Sales diizinkan memberi potongan nego tunai/transfer hingga batas {formatIDR(eco.minPrice)}.
              </p>
            </div>
          </div>

          {/* Owner Only Breakdown */}
          {role === 'owner' && (
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                👑 Analisa Modal HPP Showroom (Khusus Owner)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Harga Beli:</span>
                  <span className="font-mono font-bold text-zinc-200">{formatIDR(unit.buyPrice)}</span>
                </div>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Biaya Servis:</span>
                  <span className="font-mono font-bold text-rose-400">+{formatIDR(unit.repairCost)}</span>
                </div>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Total HPP:</span>
                  <span className="font-mono font-black text-amber-400">{formatIDR(eco.totalModal)}</span>
                </div>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Estimasi Laba:</span>
                  <span className="font-mono font-black text-emerald-400">+{formatIDR(eco.estimatedProfit)} ({eco.marginPercent}%)</span>
                </div>
              </div>
            </div>
          )}

          {/* Repairs */}
          {unit.repairs && unit.repairs.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Riwayat Servis Bengkel:</h4>
              <div className="space-y-1">
                {unit.repairs.map((r) => (
                  <div key={r.id} className="p-2 rounded bg-zinc-950 border border-zinc-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-zinc-500 font-mono text-[10px] mr-2">{r.date}</span>
                      <span className="font-medium text-zinc-200">{r.item}</span>
                      <span className="text-zinc-500 text-[10px] ml-1">({r.mechanic})</span>
                    </div>
                    <span className="font-mono font-bold text-rose-400">{formatIDR(r.cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2">
          {unit.status === 'Tersedia' && (
            <button
              onClick={() => {
                onClose();
                onOpenPOS(unit);
              }}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Jual Unit Ini
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
