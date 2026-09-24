import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Grid3X3, 
  List
} from 'lucide-react';
import { formatIDR, calculateUnitEconomics } from '../data/mockData';

export default function Inventory({ 
  units = [], 
  role, 
  onSelectUnit, 
  onOpenPOS, 
  onOpenNewUnit 
}) {
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedTax, setSelectedTax] = useState('All');
  const [viewMode, setViewMode] = useState('table');
  const [sortBy, setSortBy] = useState('newest');

  const brands = ['All', 'Honda', 'Yamaha', 'Vespa', 'Kawasaki', 'Suzuki'];

  const filteredUnits = units.filter((unit) => {
    const matchSearch = 
      unit.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.color?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchBrand = selectedBrand === 'All' || unit.brand?.toLowerCase() === selectedBrand.toLowerCase();
    const matchStatus = selectedStatus === 'All' || unit.status?.toLowerCase() === selectedStatus.toLowerCase();
    const matchTax = selectedTax === 'All' || unit.taxStatus === selectedTax;

    return matchSearch && matchBrand && matchStatus && matchTax;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return (a.displayPrice || 0) - (b.displayPrice || 0);
    if (sortBy === 'price-desc') return (b.displayPrice || 0) - (a.displayPrice || 0);
    return b.id - a.id;
  });

  return (
    <div className="space-y-5 pb-20 md:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2 font-mono">
              <Layers className="w-5 h-5 text-amber-400" />
              Katalog & Stok Unit Showroom
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
              {units.length} Unit Terdaftar
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manajemen stok motor, perhitungan modal HPP, batas minimal penawaran sales, dan kelengkapan dokumen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOwnerOrAdmin && (
            <button
              onClick={onOpenNewUnit}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              Tambah Motor Baru
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewMode('table')}
              aria-label="Tampilan tabel"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Tampilan grid katalog"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nopol (AD 1234), merk, tipe, warna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="All">Semua Status Unit</option>
              <option value="Tersedia">🟢 Unit Ready (Tersedia)</option>
              <option value="Titip DP / Tempo">🟡 Titip DP / Tempo</option>
              <option value="Terjual">🔴 Terjual</option>
            </select>
          </div>

          <div>
            <select
              value={selectedTax}
              onChange={(e) => setSelectedTax(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="All">Semua Kondisi Pajak</option>
              <option value="Hidup">✅ Pajak Hidup</option>
              <option value="Mati Pajak">⚠️ Pajak Mati</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="newest">Terbaru Masuk</option>
              <option value="price-asc">Harga Terendah</option>
              <option value="price-desc">Harga Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Brand Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-zinc-800/60">
          <span className="text-[11px] text-zinc-500 font-medium mr-1">Merk:</span>
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                selectedBrand === brand
                  ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              {brand === 'All' ? 'Semua' : brand}
            </button>
          ))}
        </div>
      </div>

      {/* When Empty: Beautiful Clean State */}
      {units.length === 0 ? (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-zinc-100">
              Katalog Stok Masih Kosong
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Belum ada data unit motor yang dimasukkan. Anda dapat mulai mencatat motor pertama masuk untuk showroom Anda sekarang.
            </p>
          </div>
          {isOwnerOrAdmin && (
            <div className="pt-2">
              <button
                onClick={onOpenNewUnit}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 mx-auto shadow-md transition-transform hover:scale-105"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Input Motor Pertama
              </button>
            </div>
          )}
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 text-center text-xs text-zinc-400 space-y-2">
          <p>Tidak ada motor yang cocok dengan pencarian atau filter yang dipilih.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedBrand('All');
              setSelectedStatus('All');
              setSelectedTax('All');
            }}
            className="px-3 py-1 rounded bg-zinc-800 text-zinc-200 font-semibold"
          >
            Reset Filter
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Unit Motor</th>
                  <th className="py-3 px-4">No. Polisi</th>
                  <th className="py-3 px-4">Tahun / Warna</th>
                  <th className="py-3 px-4">Status Pajak</th>
                  {role === 'owner' && <th className="py-3 px-4 font-mono">Total HPP Modal</th>}
                  <th className="py-3 px-4 font-mono">Batas Min. Nego</th>
                  <th className="py-3 px-4 font-mono">Harga Display</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUnits.map((unit) => {
                  const eco = calculateUnitEconomics(unit);
                  return (
                    <tr key={unit.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-100">{unit.brand} {unit.model}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{(unit.odometer || 0).toLocaleString('id-ID')} km</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{unit.plate}</td>
                      <td className="py-3 px-4">{unit.year} • {unit.color}</td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          unit.taxStatus === 'Hidup' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {unit.taxStatus}
                        </span>
                      </td>
                      {role === 'owner' && (
                        <td className="py-3 px-4 font-mono font-semibold text-zinc-300">
                          {formatIDR(eco.totalModal)}
                        </td>
                      )}
                      <td className="py-3 px-4 font-mono font-semibold text-rose-400">
                        {formatIDR(eco.minPrice)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-100">
                        {formatIDR(unit.displayPrice)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          unit.status === 'Tersedia' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                            : unit.status === 'Titip DP / Tempo'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {unit.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectUnit(unit)}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors"
                          >
                            Detail
                          </button>
                          {isOwnerOrAdmin && unit.status === 'Tersedia' && (
                            <button
                              onClick={() => onOpenPOS(unit)}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-bold transition-colors"
                            >
                              Jual
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => {
            const eco = calculateUnitEconomics(unit);
            const thumb = unit.images?.[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80';
            return (
              <div
                key={unit.id}
                className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-zinc-950 overflow-hidden">
                    <img
                      src={thumb}
                      alt={unit.model}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-zinc-950/90 text-amber-400 border border-zinc-800">
                        {unit.plate}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        unit.taxStatus === 'Hidup' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        Pajak {unit.taxStatus}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-zinc-200">
                      <span className="font-semibold bg-zinc-950/80 px-2 py-0.5 rounded">{unit.brand} • {unit.year}</span>
                      <span className="font-mono bg-zinc-950/80 px-2 py-0.5 rounded text-[11px] text-zinc-300">
                        {(unit.odometer || 0).toLocaleString('id-ID')} km
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-bold text-zinc-100">{unit.brand} {unit.model}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{unit.condition || 'Full orisinil terawat'}</p>

                    {role === 'owner' ? (
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                        <div className="flex justify-between text-zinc-400">
                          <span>Modal HPP:</span>
                          <span className="font-mono font-bold text-zinc-200">{formatIDR(eco.totalModal)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-bold">
                          <span>Estimasi Laba:</span>
                          <span className="font-mono">+{formatIDR(eco.estimatedProfit)} ({eco.marginPercent}%)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs flex justify-between">
                        <span className="text-zinc-400">Batas Min. Nego:</span>
                        <span className="font-mono font-bold text-rose-400">{formatIDR(eco.minPrice)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Harga Iklan</span>
                      <span className="text-sm font-black text-amber-400 font-mono">{formatIDR(unit.displayPrice)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectUnit(unit)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
                      >
                        Detail
                      </button>
                      {isOwnerOrAdmin && unit.status === 'Tersedia' && (
                        <button
                          onClick={() => onOpenPOS(unit)}
                          className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold"
                        >
                          Jual
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
