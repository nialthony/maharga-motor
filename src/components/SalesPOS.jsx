import React, { useState } from 'react';
import { 
  CreditCard, 
  Layers, 
  User, 
  DollarSign, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  Plus,
  Search,
  X,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatIDR, calculateUnitEconomics } from '../data/mockData';

const generateTransactionId = () => `TX-${Date.now().toString().slice(-6)}`;

export default function SalesPOS({ 
  units = [], 
  selectedUnit, 
  setSelectedUnit, 
  onTransactionComplete, 
  currentUser,
  employees = [],
  onOpenNewUnit
}) {
  const readyUnits = units.filter(u => u.status === 'Tersedia');
  const activeUnit = selectedUnit && selectedUnit.status === 'Tersedia' 
    ? selectedUnit 
    : readyUnits[0] || null;

  const eco = activeUnit ? calculateUnitEconomics(activeUnit) : { minPrice: 0, totalModal: 0 };

  // Sales Staff Selection: HANYA staf sales (owner, admin, dan mekanik tidak ditampilkan)
  const salesStaffList = employees.filter(e => 
    (e.role === 'sales') && e.status !== 'inactive' && e.status !== 'suspended'
  );
  const defaultSalesId = (currentUser?.role === 'sales' ? currentUser.id : null) || salesStaffList[0]?.id || 'custom';
  const [selectedSalesId, setSelectedSalesId] = useState(defaultSalesId);
  const [customSalesName, setCustomSalesName] = useState('');

  // Sistem Komisi Resmi: 2 jenis pilihan (100rb & 200rb)
  const [commissionAmount, setCommissionAmount] = useState(200000);

  // Form State
  const [dealPrice, setDealPrice] = useState(activeUnit ? activeUnit.displayPrice : '');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'transfer' | 'dp-tempo'
  const [dpAmount, setDpAmount] = useState(10000000);
  const [dueDate, setDueDate] = useState('2026-10-20');
  const [guarantee, setGuarantee] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modern Unit Modal Chooser State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');

  const readyBrands = React.useMemo(() => {
    return ['ALL', ...new Set(readyUnits.map(u => u.brand).filter(Boolean))];
  }, [readyUnits]);

  const filteredReadyUnits = React.useMemo(() => {
    return readyUnits.filter(u => {
      const matchBrand = selectedBrand === 'ALL' || u.brand?.toLowerCase() === selectedBrand.toLowerCase();
      const q = unitSearchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (u.plate || '').toLowerCase().includes(q) || 
        (u.model || '').toLowerCase().includes(q) || 
        (u.brand || '').toLowerCase().includes(q);
      return matchBrand && matchSearch;
    });
  }, [readyUnits, selectedBrand, unitSearchQuery]);

  const [prevActiveUnitId, setPrevActiveUnitId] = useState(activeUnit?.id);
  if (activeUnit && activeUnit.id !== prevActiveUnitId) {
    setPrevActiveUnitId(activeUnit.id);
    setDealPrice(activeUnit.displayPrice || '');
  }

  const handleUnitChange = (unitId) => {
    const unit = units.find(u => u.id === Number(unitId));
    if (unit) {
      setSelectedUnit(unit);
      setDealPrice(unit.displayPrice);
    }
  };

  const handlePriceChange = (val) => {
    const raw = val.replace(/[^0-9]/g, '');
    if (raw === '') {
      setDealPrice('');
      setErrorMsg('');
      return;
    }
    const num = Number(raw);
    setDealPrice(num);
    if (num < eco.minPrice) {
      setErrorMsg(`Harga deal tidak boleh di bawah batas minimal ${formatIDR(eco.minPrice)}!`);
    } else {
      setErrorMsg('');
    }
  };

  const selectedSalesStaff = salesStaffList.find(s => s.id === Number(selectedSalesId));
  const finalSalesName = selectedSalesId === 'custom' 
    ? (customSalesName.trim() || 'Mediator / Makelar Luar')
    : (selectedSalesStaff?.name || currentUser?.name || 'Staff Sales');

  // Profit calculation for this deal
  const numDealPrice = Number(dealPrice) || 0;
  const estimatedGrossProfit = numDealPrice - eco.totalModal;
  const estimatedNetProfit = estimatedGrossProfit - commissionAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activeUnit) {
      setErrorMsg('Pilih unit motor yang valid terlebih dahulu.');
      return;
    }

    const finalDealPrice = Number(dealPrice) || 0;
    const finalDpAmount = Number(dpAmount) || 0;

    if (finalDealPrice < eco.minPrice) {
      setErrorMsg(`Transaksi ditolak: Harga deal ${formatIDR(finalDealPrice)} di bawah batas minimal ${formatIDR(eco.minPrice)}!`);
      return;
    }

    if (!buyerName.trim()) {
      setErrorMsg('Nama pembeli wajib diisi.');
      return;
    }

    if (paymentMethod === 'dp-tempo' && finalDpAmount >= finalDealPrice) {
      setErrorMsg('Untuk skema titip DP/tempo, nilai DP harus lebih kecil dari harga deal total.');
      return;
    }

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });

    const newTx = {
      id: generateTransactionId(),
      unitId: activeUnit.id,
      unitName: `${activeUnit.brand} ${activeUnit.model} (${activeUnit.year})`,
      plate: activeUnit.plate,
      salesId: selectedSalesId === 'custom' ? 999 : Number(selectedSalesId),
      salesName: finalSalesName,
      buyerName,
      buyerPhone,
      buyerAddress,
      dealPrice: finalDealPrice,
      paymentMethod,
      dpAmount: paymentMethod === 'dp-tempo' ? finalDpAmount : finalDealPrice,
      remainingAmount: paymentMethod === 'dp-tempo' ? Math.max(0, finalDealPrice - finalDpAmount) : 0,
      dueDate: paymentMethod === 'dp-tempo' ? dueDate : null,
      guarantee: paymentMethod === 'dp-tempo' ? guarantee : null,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      commission: Number(commissionAmount),
      status: paymentMethod === 'dp-tempo' ? 'Tempo Aktif' : 'Lunas'
    };

    onTransactionComplete(newTx, activeUnit.id, paymentMethod === 'dp-tempo' ? 'Titip DP / Tempo' : 'Terjual');
  };

  if (readyUnits.length === 0) {
    return (
      <div className="space-y-5 pb-20 md:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2 font-mono">
              <CreditCard className="w-5 h-5 text-amber-400" />
              Kasir Penjualan Unit (Cash & Titip DP)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Pilih unit motor, tentukan staf sales yang menjual, dan atur nominal komisi transaksi.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-zinc-100">
              Belum Ada Unit Stok Tersedia
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Kasir membutuhkan unit motor berstatus <strong>"Tersedia"</strong> untuk melakukan transaksi jual. Silakan masukkan data motor masuk terlebih dahulu.
            </p>
          </div>
          {onOpenNewUnit && (
            <div className="pt-2">
              <button
                onClick={onOpenNewUnit}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 mx-auto shadow-md transition-transform hover:scale-105"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Input Motor Masuk Sekarang
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 md:pb-12">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2 font-mono">
          <CreditCard className="w-5 h-5 text-amber-400" />
          Kasir Penjualan Unit (Cash & Titip DP)
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Pilih unit motor, tentukan staf sales yang menjual, dan atur nominal komisi transaksi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          
          {/* STEP 1: Unit Selection */}
          <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                1. Pilih Unit Kendaraan
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">
                {readyUnits.length} Unit Tersedia
              </span>
            </div>

            {activeUnit ? (
              <button
                type="button"
                onClick={() => setIsUnitModalOpen(true)}
                className="w-full p-3 rounded-xl bg-zinc-950/80 hover:bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {(activeUnit.images?.[0] || activeUnit.image) ? (
                      <img 
                        src={activeUnit.images?.[0] || activeUnit.image} 
                        alt={activeUnit.model} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-xs font-mono font-bold text-amber-500">
                        {activeUnit.brand?.slice(0, 3)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                        {activeUnit.plate}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {activeUnit.brand} {activeUnit.model} ({activeUnit.year})
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      <span>Display: <strong className="text-amber-600 dark:text-amber-400 font-mono">{formatIDR(activeUnit.displayPrice)}</strong></span>
                      <span>•</span>
                      <span>Batas Bawah: <strong className="text-rose-600 dark:text-rose-400 font-mono">{formatIDR(eco.minPrice)}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                  <span>Ganti Unit</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsUnitModalOpen(true)}
                className="w-full py-4 px-3 rounded-xl bg-zinc-950/80 border border-dashed border-zinc-700 text-xs text-amber-600 dark:text-amber-400 font-bold hover:bg-zinc-900 text-center"
              >
                + Pilih Unit Motor Stok Tersedia
              </button>
            )}
          </div>

          {/* STEP 2: Sales Person & Commission Settings */}
          <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3.5">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Users className="w-4 h-4" />
                2. Sales Penjual & Setting Komisi Unit
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Wajib Dicatat</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Sales Person Selector */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">
                  Staf Sales yang Menjual *
                </label>
                <select
                  value={selectedSalesId}
                  onChange={(e) => setSelectedSalesId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-bold focus:outline-none focus:border-amber-400"
                >
                  {salesStaffList.length > 0 ? (
                    salesStaffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        👤 {staff.name} (@{staff.username || 'sales'})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>(Belum ada akun sales terdaftar)</option>
                  )}
                  <option value="custom">➕ Mediator / Makelar Luar / Lainnya</option>
                </select>

                {selectedSalesId === 'custom' && (
                  <input
                    type="text"
                    placeholder="Nama Mediator / Sales Luar"
                    value={customSalesName}
                    onChange={(e) => setCustomSalesName(e.target.value)}
                    className="w-full mt-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-amber-500/50 text-zinc-100 text-xs focus:outline-none"
                  />
                )}
              </div>

              {/* Commission Tier Settings */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">
                  Skema Komisi Sales (Sistem 100rb & 200rb) *
                </label>
                
                {/* 2 Jenis Komisi Resmi Showroom: 100rb dan 200rb */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setCommissionAmount(100000)}
                    className={`py-2 px-3 rounded-lg text-center font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      commissionAmount === 100000
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    <span>Rp 100.000 / Unit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommissionAmount(200000)}
                    className={`py-2 px-3 rounded-lg text-center font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      commissionAmount === 200000
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    <span>Rp 200.000 / Unit</span>
                  </button>
                </div>

                <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Komisi Disetel:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatIDR(commissionAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Buyer Data */}
          <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-400" />
              3. Data Pembeli
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Nama Pembeli *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama sesuai KTP"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">No. WhatsApp / HP *</label>
                <input
                  type="text"
                  required
                  placeholder="081234567890"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-300 block mb-1">Alamat Domisili</label>
                <input
                  type="text"
                  placeholder="Alamat lengkap kota/kabupaten"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* STEP 4: Payment & Deal Price */}
          <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              4. Harga Deal & Skema Pembayaran
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Harga Deal Akhir (Rp) *</label>
                <input
                  type="text"
                  required
                  value={dealPrice === '' ? '' : new Intl.NumberFormat('id-ID').format(dealPrice)}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono font-black text-base focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Metode Pembayaran *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-bold focus:outline-none focus:border-amber-400"
                >
                  <option value="cash">💵 Cash / Tunai Showroom (Lunas)</option>
                  <option value="transfer">🏦 Transfer Bank Resmi (Lunas)</option>
                  <option value="dp-tempo">⏱️ Titip DP / Cash-Tempo (Pelunasan Singkat)</option>
                </select>
              </div>
            </div>

            {/* DP / Tempo Details */}
            {paymentMethod === 'dp-tempo' && (
              <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/60 space-y-3 mt-2">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Detail Titip DP & Jadwal Pelunasan
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">Uang Muka / DP Diterima (Rp) *</label>
                    <input
                      type="text"
                      required
                      value={dpAmount === '' ? '' : new Intl.NumberFormat('id-ID').format(dpAmount)}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setDpAmount(raw === '' ? '' : Number(raw));
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">Batas Waktu Pelunasan *</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                      Dokumen / Barang Jaminan Fisik *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: BPKB Asli Vario 110 (AD 5542 KL) + FC KTP"
                      value={guarantee}
                      onChange={(e) => setGuarantee(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded bg-zinc-950 flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Sisa Pelunasan Wajib:</span>
                  <span className="font-mono font-black text-amber-400">
                    {formatIDR(Math.max(0, dealPrice - dpAmount))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Summary Column */}
        <div>
          <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3 sticky top-20 shadow-md">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Ringkasan Transaksi & Komisi
            </h3>

            {errorMsg && (
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2 text-xs border-y border-zinc-800 py-3">
              <div className="flex justify-between text-zinc-400">
                <span>Unit:</span>
                <span className="font-bold text-zinc-100">{activeUnit?.model}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Plat:</span>
                <span className="font-mono font-bold text-amber-400">{activeUnit?.plate}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Sales:</span>
                <span className="font-bold text-amber-300 truncate max-w-[140px]">{finalSalesName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Komisi:</span>
                <span className="font-mono font-bold text-emerald-400">{formatIDR(commissionAmount)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Pembeli:</span>
                <span className="font-bold text-zinc-200">{buyerName || '-'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Skema:</span>
                <span className="font-bold text-zinc-200 uppercase">{paymentMethod}</span>
              </div>
              
              <div className="pt-2 border-t border-zinc-800 space-y-1">
                <div className="flex justify-between text-zinc-100 font-bold text-sm">
                  <span>Harga Deal:</span>
                  <span className="font-mono text-emerald-400">{formatIDR(dealPrice)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Est. Laba Bersih Showroom:</span>
                  <span className="text-zinc-200">{formatIDR(estimatedNetProfit)}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Selesaikan & Cetak Dokumen SPK
            </button>
            <p className="text-[10px] text-zinc-500 text-center">
              Otomatis catat komisi ke akun sales dan cetak Kwitansi/SPK resmi.
            </p>
          </div>
        </div>
      </form>

      {/* Unit Chooser Modal */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">
                    Pilih Unit Kendaraan (Stok Ready)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Pilih unit motor yang akan ditransaksikan di kasir showroom
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUnitModalOpen(false)}
                aria-label="Tutup pencarian unit"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/60 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari plat nomor, tipe, merk motor (cth: Beat, Vario, AD 1234)..."
                  value={unitSearchQuery}
                  onChange={(e) => setUnitSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-400 placeholder:text-zinc-500 font-sans"
                  autoFocus
                />
              </div>

              {/* Brand Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {readyBrands.map((b) => (
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
            <div className="p-3 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredReadyUnits.length > 0 ? (
                filteredReadyUnits.map((u) => {
                  const isCurrent = activeUnit?.id === u.id;
                  const uEco = calculateUnitEconomics(u);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        handleUnitChange(u.id);
                        setIsUnitModalOpen(false);
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/50'
                          : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {(u.images?.[0] || u.image) ? (
                            <img src={u.images?.[0] || u.image} alt={u.model} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-mono font-bold text-amber-500/80">{u.brand?.slice(0, 3)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                            {u.plate}
                          </span>
                          <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                            {u.brand} {u.model}
                          </h5>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            Tahun {u.year} • {u.color || 'Standar'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-zinc-500 block">Display:</span>
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          {formatIDR(u.displayPrice)}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">Batas Bawah:</span>
                        <span className="text-[10px] font-mono font-bold text-rose-500 dark:text-rose-400">
                          {formatIDR(uEco.minPrice)}
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
