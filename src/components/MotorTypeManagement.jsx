import React, { useState } from 'react';
import { 
  Tag, 
  Layers, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Sparkles
} from 'lucide-react';

import Badge from './ui/Badge';

export default function MotorTypeManagement({
  brands = [],
  setBrands,
  types = [],
  setTypes,
  onSave
}) {
  const [activeTab, setActiveTab] = useState('types'); // 'brands' | 'types'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('all');

  // Form states for Brand
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandNameInput, setBrandNameInput] = useState('');
  const [isAddingBrand, setIsAddingBrand] = useState(false);

  // Form states for Type/Model
  const [editingType, setEditingType] = useState(null);
  const [typeBrandIdInput, setTypeBrandIdInput] = useState(brands[0]?.id || 1);
  const [typeNameInput, setTypeNameInput] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);

  // Feedback message
  const [notice, setNotice] = useState(null);

  const showNotice = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 3500);
  };

  // --- BRAND ACTIONS ---
  const handleSaveBrand = (e) => {
    e.preventDefault();
    const cleanName = brandNameInput.trim();
    if (!cleanName) return;

    if (editingBrand) {
      const updatedBrands = brands.map(b => b.id === editingBrand.id ? { ...b, name: cleanName } : b);
      const updatedTypes = types.map(t => t.brandId === editingBrand.id ? { ...t, brandName: cleanName } : t);
      setBrands(updatedBrands);
      setTypes(updatedTypes);
      if (onSave) onSave(updatedBrands, updatedTypes);
      showNotice(`Merk "${cleanName}" berhasil diperbarui.`);
      setEditingBrand(null);
    } else {
      const newId = brands.length > 0 ? Math.max(...brands.map(b => b.id)) + 1 : 1;
      const newBrand = { id: newId, name: cleanName };
      const updatedBrands = [...brands, newBrand];
      setBrands(updatedBrands);
      if (onSave) onSave(updatedBrands, types);
      showNotice(`Merk baru "${cleanName}" berhasil ditambahkan.`);
      setIsAddingBrand(false);
    }
    setBrandNameInput('');
  };

  const handleDeleteBrand = (brand) => {
    const hasTypes = types.some(t => t.brandId === brand.id);
    if (hasTypes) {
      alert(`Merk "${brand.name}" tidak dapat dihapus karena masih memiliki tipe/model motor yang terdaftar.\nHapus atau pindahkan tipe motor terlebih dahulu.`);
      return;
    }

    if (window.confirm(`Hapus merk "${brand.name}" dari sistem?`)) {
      const updatedBrands = brands.filter(b => b.id !== brand.id);
      setBrands(updatedBrands);
      if (onSave) onSave(updatedBrands, types);
      showNotice(`Merk "${brand.name}" berhasil dihapus.`, 'info');
    }
  };

  // --- TYPE / MODEL ACTIONS ---
  const handleSaveType = (e) => {
    e.preventDefault();
    const cleanName = typeNameInput.trim();
    const brandId = Number(typeBrandIdInput);
    const targetBrand = brands.find(b => b.id === brandId);
    if (!cleanName || !targetBrand) return;

    if (editingType) {
      const updatedTypes = types.map(t => t.id === editingType.id ? {
        ...t,
        brandId: targetBrand.id,
        brandName: targetBrand.name,
        name: cleanName
      } : t);
      setTypes(updatedTypes);
      if (onSave) onSave(brands, updatedTypes);
      showNotice(`Tipe "${cleanName}" berhasil diperbarui.`);
      setEditingType(null);
    } else {
      const newId = types.length > 0 ? Math.max(...types.map(t => t.id)) + 1 : 1;
      const newType = {
        id: newId,
        brandId: targetBrand.id,
        brandName: targetBrand.name,
        name: cleanName
      };
      const updatedTypes = [...types, newType];
      setTypes(updatedTypes);
      if (onSave) onSave(brands, updatedTypes);
      showNotice(`Tipe baru "${targetBrand.name} ${cleanName}" berhasil ditambahkan.`);
      setIsAddingType(false);
    }
    setTypeNameInput('');
  };

  const handleDeleteType = (typeItem) => {
    if (window.confirm(`Hapus tipe "${typeItem.brandName} ${typeItem.name}"?`)) {
      const updatedTypes = types.filter(t => t.id !== typeItem.id);
      setTypes(updatedTypes);
      if (onSave) onSave(brands, updatedTypes);
      showNotice(`Tipe "${typeItem.name}" berhasil dihapus.`, 'info');
    }
  };

  // Filtering
  const filteredTypes = types.filter(t => {
    const matchesBrand = selectedBrandFilter === 'all' || t.brandId === Number(selectedBrandFilter);
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.brandName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesSearch;
  });

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Notice Banner */}
      {notice && (
        <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in ${
          notice.type === 'info' 
            ? 'bg-amber-950/60 border-amber-800 text-amber-300' 
            : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
        }`}>
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{notice.msg}</span>
        </div>
      )}

      {/* Sub Tabs: Merk vs Tipe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('types')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'types'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Tipe Motor</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-950/40">
              {types.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('brands')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'brands'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Master Merk Motor</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-950/40">
              {brands.length}
            </span>
          </button>
        </div>

        {/* Action Button */}
        <div>
          {activeTab === 'types' ? (
            <button
              onClick={() => {
                setIsAddingType(true);
                setEditingType(null);
                setTypeNameInput('');
                setTypeBrandIdInput(brands[0]?.id || 1);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tipe Baru</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsAddingBrand(true);
                setEditingBrand(null);
                setBrandNameInput('');
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Merk Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL / FORM INLINE: TAMBAH / EDIT MERK */}
      {/* ========================================================= */}
      {(isAddingBrand || editingBrand) && (
        <form onSubmit={handleSaveBrand} className="bg-zinc-900/90 border border-amber-500/50 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>{editingBrand ? `Edit Merk: ${editingBrand.name}` : 'Tambah Merk Motor Baru'}</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsAddingBrand(false);
                setEditingBrand(null);
              }}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Nama Merk (Contoh: Honda, Yamaha, Kawasaki)</label>
              <input
                type="text"
                value={brandNameInput}
                onChange={(e) => setBrandNameInput(e.target.value)}
                placeholder="Masukkan nama merk..."
                required
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex gap-2 sm:self-end w-full sm:w-auto">
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Merk</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingBrand(false);
                  setEditingBrand(null);
                }}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* MODAL / FORM INLINE: TAMBAH / EDIT TIPE */}
      {/* ========================================================= */}
      {(isAddingType || editingType) && (
        <form onSubmit={handleSaveType} className="bg-zinc-900/90 border border-amber-500/50 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{editingType ? `Edit Tipe: ${editingType.name}` : 'Tambah Tipe Motor Baru'}</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsAddingType(false);
                setEditingType(null);
              }}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Pilih Merk Induk</label>
              <select
                value={typeBrandIdInput}
                onChange={(e) => setTypeBrandIdInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              >
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Nama Tipe / Seri (Contoh: NMAX, Scoopy, Aerox)</label>
              <input
                type="text"
                value={typeNameInput}
                onChange={(e) => setTypeNameInput(e.target.value)}
                placeholder="Masukkan nama tipe / seri..."
                required
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingType(false);
                setEditingType(null);
              }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Tipe</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'types' ? "Cari merk atau tipe motor..." : "Cari merk motor..."}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {activeTab === 'types' && (
          <div className="w-full sm:w-auto">
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Semua Merk ({brands.length})</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* TAB CONTENT 1: MASTER TIPE MOTOR TABLE */}
      {/* ========================================================= */}
      {activeTab === 'types' && (
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[520px] w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">No</th>
                  <th className="px-4 py-3 font-semibold">Merk Motor</th>
                  <th className="px-4 py-3 font-semibold">Nama Tipe / Seri</th>
                  <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredTypes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-zinc-500 text-xs">
                      Tidak ada tipe motor yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredTypes.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 text-zinc-500 font-mono text-[11px]">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <Badge variant="zincLight" size="sm">
                          {item.brandName}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-bold text-zinc-100">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingType(item);
                              setIsAddingType(false);
                              setTypeNameInput(item.name);
                              setTypeBrandIdInput(item.brandId);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition-colors"
                            title="Edit Tipe"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteType(item)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors"
                            title="Hapus Tipe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ========================================================= */}
      {/* TAB CONTENT 2: MASTER MERK MOTOR TABLE */}
      {/* ========================================================= */}
      {activeTab === 'brands' && (
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[520px] w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">No</th>
                  <th className="px-4 py-3 font-semibold">Nama Merk</th>
                  <th className="px-4 py-3 font-semibold">Jumlah Tipe Terdaftar</th>
                  <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-zinc-500 text-xs">
                      Tidak ada merk yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredBrands.map((brand, idx) => {
                    const count = types.filter(t => t.brandId === brand.id).length;
                    return (
                      <tr key={brand.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 text-zinc-500 font-mono text-[11px]">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-zinc-100 flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-amber-400" />
                          <span>{brand.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="zinc" size="base" mono className="text-[10px]">
                            {count} Model / Tipe
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingBrand(brand);
                                setIsAddingBrand(false);
                                setBrandNameInput(brand.name);
                              }}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition-colors"
                              title="Edit Merk"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBrand(brand)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors"
                              title="Hapus Merk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
