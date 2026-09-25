import React, { useState } from 'react';
import { Wrench, Plus } from 'lucide-react';
import { formatIDR } from '../data/mockData';

export default function WorkshopService({ units = [], onAddRepair, mechanics = [] }) {
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id || '');
  const [item, setItem] = useState('');
  const [mechanic, setMechanic] = useState(mechanics[0]?.name || '');
  const [cost, setCost] = useState(150000);

  const selectedUnit = units.find(u => u.id === Number(selectedUnitId)) || units[0];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!item.trim() || !selectedUnit) return;

    const newRepair = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      item,
      mechanic,
      cost: Number(cost)
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

      {units.length === 0 ? (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-8 text-center space-y-3 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 text-amber-400 flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-100">Belum Ada Unit Motor di Showroom</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Silakan tambahkan unit motor masuk terlebih dahulu melalui menu <strong>Input Unit</strong> agar dapat mencatat riwayat servis dan akumulasi HPP.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-4">
            <form onSubmit={handleAdd} className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                Input Tindakan / Sparepart Baru
              </h3>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Pilih Unit Motor</label>
                <select
                  value={selectedUnit ? selectedUnit.id : ''}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-bold focus:outline-none focus:border-amber-400"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      [{u.plate}] {u.brand} {u.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Tindakan / Penggantian Part</label>
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
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Mekanik</label>
                  <select
                    value={mechanic}
                    onChange={(e) => setMechanic(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-400"
                  >
                    {mechanics.map((m) => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                    <option value="Bengkel Luar">Pihak Ketiga (Luar)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Biaya (Rp)</label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono font-bold text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-sm"
              >
                Simpan ke Log HPP
              </button>
            </form>

            {/* Roster Mekanik */}
            <div className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800 space-y-2 text-xs">
              <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Mekanik Showroom</h4>
              <div className="space-y-1.5">
                {mechanics.map((m) => (
                  <div key={m.id} className="p-2 rounded bg-zinc-950 flex items-center justify-between border border-zinc-800/60">
                    <div>
                      <span className="font-bold text-zinc-200 block">{m.name}</span>
                      <span className="text-[10px] text-zinc-500">{m.role}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">Aktif</span>
                  </div>
                ))}
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
    </div>
  );
}
