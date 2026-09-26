import React, { useState, useMemo } from 'react';
import { Wrench, Plus, Users, Search, X, ChevronRight } from 'lucide-react';
import { formatIDR } from '../data/mockData';
import RoleBadge from './RoleBadge';

export default function WorkshopService({ units = [], onAddRepair, mechanics = [], employees = [] }) {
  // Hanya tampilkan unit yang belum terjual (stok ready showroom)
  const availableUnits = useMemo(() => {
    return (units || []).filter(u => {
      const st = (u.status || '').toLowerCase();
      return st !== 'terjual' && st !== 'sold';
    });
  }, [units]);

  // Ambil daftar mekanik terdaftar dari tabel employees & props mechanics
  const registeredFromEmployees = useMemo(() => {
    return (employees || []).filter(e => 
      (e.role === 'mechanic' || e.role === 'mekanik') && e.status !== 'inactive' && e.status !== 'suspended'
    );
  }, [employees]);

  const allMechanics = useMemo(() => {
    return registeredFromEmployees.length > 0 
      ? registeredFromEmployees 
      : (mechanics.length > 0 ? mechanics : []);
  }, [registeredFromEmployees, mechanics]);

  const [selectedUnitId, setSelectedUnitId] = useState(availableUnits[0]?.id || '');
  const [item, setItem] = useState('');
  const [mechanic, setMechanic] = useState('');
  const [cost, setCost] = useState(150000);

  // Pop-up Unit Chooser State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');

  const activeMechanic = mechanic || (allMechanics.length > 0 ? allMechanics[0].name : 'Bengkel Luar / Pihak Ketiga');
  const selectedUnit = availableUnits.find(u => u.id === Number(selectedUnitId)) || availableUnits[0] || null;

  // Extract unique brands for brand tabs
  const brands = useMemo(() => {
    const list = Array.from(new Set(availableUnits.map(u => u.brand).filter(Boolean)));
    return ['ALL', ...list];
  }, [availableUnits]);

  // Filter units by brand & search query
  const filteredUnits = useMemo(() => {
    return availableUnits.filter(u => {
      const matchBrand = selectedBrand === 'ALL' || u.brand?.toLowerCase() === selectedBrand.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (u.plate || '').toLowerCase().includes(q) || 
        (u.model || '').toLowerCase().includes(q) || 
        (u.brand || '').toLowerCase().includes(q);
      return matchBrand && matchSearch;
    });
  }, [availableUnits, selectedBrand, searchQuery]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!item.trim() || !selectedUnit) return;

    const newRepair = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      item,
      mechanic: activeMechanic,
      cost: Number(cost) || 0
    };

    onAddRepair(selectedUnit.id, newRepair);
    setItem('');
    setCost(100000);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2 font-mono">
              <Wrench className="w-5 h-5 text-amber-400" />
              Bengkel, Restorasi & Log HPP
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Catat pengeluaran sparepart & jasa mekanik per unit motor. Biaya otomatis diakumulasikan ke nilai modal pokok (HPP).
          </p>
        </div>
      </div>

      {availableUnits.length === 0 ? (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-8 text-center space-y-3 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 text-amber-400 flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-100">Belum Ada Unit Motor Stok Tersedia</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Semua unit motor telah terjual atau belum ada unit yang dimasukkan. Silakan tambahkan unit motor masuk terlebih dahulu melalui menu <strong>Input Unit</strong>.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-4">
            <form onSubmit={handleAdd} className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3.5 shadow-sm">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                Input Tindakan / Sparepart Baru
              </h3>

              {/* Pop-up Unit Chooser Trigger */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">
                  Unit Motor (Stok Tersedia) *
                </label>
                {selectedUnit ? (
                  <button
                    type="button"
                    onClick={() => setIsUnitModalOpen(true)}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                        {selectedUnit.image ? (
                          <img src={selectedUnit.image} alt={selectedUnit.model} className="w-full h-full object-cover" />
                        ) : (
                          <Wrench className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {selectedUnit.plate}
                          </span>
                          <span className="text-xs font-bold text-zinc-100 truncate">{selectedUnit.brand} {selectedUnit.model}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                          Tahun {selectedUnit.year} • {selectedUnit.color || 'Standar'} • Total Servis: {formatIDR(selectedUnit.repairCost || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                      <span>Ganti</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsUnitModalOpen(true)}
                    className="w-full py-3 px-3 rounded-xl bg-zinc-950 border border-dashed border-zinc-700 text-xs text-amber-400 font-bold hover:bg-zinc-900 text-center"
                  >
                    + Pilih Unit Motor Stok Tersedia
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Tindakan / Penggantian Part *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ganti Aki GS Astra + Servis CVT"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Mekanik Pelaksana</label>
                  <select
                    value={activeMechanic}
                    onChange={(e) => setMechanic(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-400"
                  >
                    {allMechanics.length > 0 ? (
                      allMechanics.map((m) => (
                        <option key={m.id || m.username} value={m.name}>
                          {m.name} (@{m.username || 'mekanik'})
                        </option>
                      ))
                    ) : (
                      <option value="">(Belum ada staf mekanik)</option>
                    )}
                    <option value="Bengkel Luar / Pihak Ketiga">Bengkel Luar / Pihak Ketiga</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Biaya (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={cost === '' ? '' : cost}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono font-bold text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
              >
                Simpan ke Log HPP
              </button>
            </form>

            {/* Roster Mekanik */}
            <div className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>Mekanik Showroom</span>
                </h4>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {allMechanics.length} Staf
                </span>
              </div>
              <div className="space-y-1.5">
                {allMechanics.length > 0 ? (
                  allMechanics.map((m) => (
                    <div key={m.id || m.username} className="p-2 rounded bg-zinc-950 flex items-center justify-between border border-zinc-800/60">
                      <div>
                        <span className="font-bold text-zinc-200 block">{m.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <RoleBadge role={m.role || 'mechanic'} className="h-4 w-auto" />
                          <span className="text-[10px] text-zinc-500 font-mono">@{m.username}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400">Aktif</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-center text-zinc-500 text-[11px] space-y-1">
                    <p>Belum ada staf dengan role mekanik terdaftar.</p>
                    <p className="text-[10px] text-zinc-400">Tambahkan akun staf role <strong>Mekanik</strong> di menu Karyawan.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Log History */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Log Servis: {selectedUnit?.brand} {selectedUnit?.model} ({selectedUnit?.plate})
                  </h3>
                  <p className="text-[11px] text-zinc-400">Total Biaya Perbaikan: <strong className="text-amber-400 font-mono">{formatIDR(selectedUnit?.repairCost || 0)}</strong></p>
                </div>
              </div>

              {selectedUnit?.repairs && selectedUnit.repairs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-bold border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-4">Tanggal</th>
                        <th className="py-2.5 px-4">Tindakan / Part</th>
                        <th className="py-2.5 px-4">Mekanik</th>
                        <th className="py-2.5 px-4 text-end">Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {selectedUnit.repairs.map((r) => (
                        <tr key={r.id} className="hover:bg-zinc-800/40">
                          <td className="py-2.5 px-4 text-zinc-400 font-mono">{r.date}</td>
                          <td className="py-2.5 px-4 font-bold text-zinc-200">{r.item}</td>
                          <td className="py-2.5 px-4 text-zinc-400">{r.mechanic}</td>
                          <td className="py-2.5 px-4 text-end font-mono font-bold text-rose-400">
                            {formatIDR(r.cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  Unit dalam kondisi orisinil tanpa catatan perbaikan tambahan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Unit Chooser Modal with Brand Filters */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 font-mono">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  Pilih Unit Motor (Stok Tersedia)
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Menampilkan {availableUnits.length} unit ready showroom (unit terjual disembunyikan)
                </p>
              </div>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                aria-label="Tutup pencarian unit"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari plat nomor (cth: AD 1234) atau nama motor (Vario, NMAX, Scoopy)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-400 placeholder:text-zinc-500 font-sans"
                  autoFocus
                />
              </div>

              {/* Brand Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {brands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBrand(b)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedBrand === b
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {b === 'ALL' ? 'Semua Merk' : b}
                  </button>
                ))}
              </div>
            </div>

            {/* Unit Grid */}
            <div className="p-3 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredUnits.length > 0 ? (
                filteredUnits.map((u) => {
                  const isCurrent = selectedUnit?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUnitId(u.id);
                        setIsUnitModalOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/50'
                          : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {u.image ? (
                            <img src={u.image} alt={u.model} className="w-full h-full object-cover" />
                          ) : (
                            <Wrench className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            {u.plate}
                          </span>
                          <h5 className="text-xs font-bold text-zinc-100 truncate mt-0.5">
                            {u.brand} {u.model}
                          </h5>
                          <p className="text-[10px] text-zinc-400">
                            Tahun {u.year} • {u.color || 'Standar'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-zinc-500 block">HPP Servis:</span>
                        <span className="text-[11px] font-mono font-bold text-amber-400">
                          {formatIDR(u.repairCost || 0)}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-zinc-500 text-xs space-y-1">
                  <p>Tidak ada unit motor stok tersedia yang cocok.</p>
                  <p className="text-[11px] text-zinc-600">Coba ubah kata kunci pencarian atau filter merk.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex justify-end">
              <button
                type="button"
                onClick={() => setIsUnitModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
