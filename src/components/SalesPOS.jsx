import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Layers, 
  User, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  BadgePercent,
  Wallet,
  Users,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatIDR, calculateUnitEconomics } from '../data/mockData';

export default function SalesPOS({ 
  units = [], 
  selectedUnit, 
  setSelectedUnit, 
  onTransactionComplete, 
  role,
  currentUser,
  employees = [],
  onOpenNewUnit
}) {
  const readyUnits = units.filter(u => u.status === 'Tersedia');
  const activeUnit = selectedUnit && selectedUnit.status === 'Tersedia' 
    ? selectedUnit 
    : readyUnits[0] || null;

  const eco = activeUnit ? calculateUnitEconomics(activeUnit) : { minPrice: 0, totalModal: 0 };

  // Sales Staff Selection (Default to current logged-in user if sales, otherwise Anas)
  const salesStaffList = employees.length > 0 
    ? employees.filter(e => e.role === 'sales' || e.role === 'admin' || e.role === 'owner')
    : [
        { id: 14, name: "Anas Nur Cholis", role: "sales" },
        { id: 12, name: "Dimas Saputra", role: "sales" },
        { id: 2, name: "Siti Rahmawati (Admin)", role: "admin" },
        { id: 1, name: "H. Maharga (Owner)", role: "owner" }
      ];

  const defaultSalesId = currentUser?.id || salesStaffList[0]?.id || 14;
  const [selectedSalesId, setSelectedSalesId] = useState(defaultSalesId);
  const [customSalesName, setCustomSalesName] = useState('');

  // Commission Preset Settings (100rb, 200rb, 350rb, Custom)
  const [commissionAmount, setCommissionAmount] = useState(200000);
  const [isCustomCommission, setIsCustomCommission] = useState(false);

  // Form State
  const [dealPrice, setDealPrice] = useState(activeUnit ? activeUnit.displayPrice : 0);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'transfer' | 'dp-tempo'
  const [dpAmount, setDpAmount] = useState(10000000);
  const [dueDate, setDueDate] = useState('2026-10-20');
  const [guarantee, setGuarantee] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (activeUnit) {
      setDealPrice(activeUnit.displayPrice || 0);
    }
  }, [activeUnit]);

  const handleUnitChange = (unitId) => {
    const unit = units.find(u => u.id === Number(unitId));
    if (unit) {
      setSelectedUnit(unit);
      setDealPrice(unit.displayPrice);
    }
  };

  const handlePriceChange = (val) => {
    const num = Number(val.replace(/[^0-9]/g, ''));
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
    : (selectedSalesStaff?.name || 'Anas Nur Cholis');

  // Profit calculation for this deal
  const estimatedGrossProfit = dealPrice - eco.totalModal;
  const estimatedNetProfit = estimatedGrossProfit - commissionAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activeUnit) {
      setErrorMsg('Pilih unit motor yang valid terlebih dahulu.');
      return;
    }

    if (dealPrice < eco.minPrice) {
      setErrorMsg(`Transaksi ditolak: Harga deal ${formatIDR(dealPrice)} di bawah batas minimal ${formatIDR(eco.minPrice)}!`);
      return;
    }

    if (!buyerName.trim()) {
      setErrorMsg('Nama pembeli wajib diisi.');
      return;
    }

    if (paymentMethod === 'dp-tempo' && dpAmount >= dealPrice) {
      setErrorMsg('Untuk skema titip DP/tempo, nilai DP harus lebih kecil dari harga deal total.');
      return;
    }

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });

    const newTx = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      unitId: activeUnit.id,
      unitName: `${activeUnit.brand} ${activeUnit.model} (${activeUnit.year})`,
      plate: activeUnit.plate,
      salesId: selectedSalesId === 'custom' ? 999 : Number(selectedSalesId),
      salesName: finalSalesName,
      buyerName,
      buyerPhone,
      buyerAddress,
      dealPrice,
      paymentMethod,
      dpAmount: paymentMethod === 'dp-tempo' ? dpAmount : dealPrice,
      remainingAmount: paymentMethod === 'dp-tempo' ? (dealPrice - dpAmount) : 0,
      dueDate: paymentMethod === 'dp-tempo' ? dueDate : null,
      guarantee: paymentMethod === 'dp-tempo' ? guarantee : null,
      date: new Date().toISOString().split('T')[0],
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
          <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              1. Pilih Unit Kendaraan
            </h3>

            <select
              value={activeUnit ? activeUnit.id : ''}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-bold focus:outline-none focus:border-amber-400"
            >
              {readyUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  [{u.plate}] - {u.brand} {u.model} ({u.year}) - Display: {formatIDR(u.displayPrice)}
                </option>
              ))}
            </select>

            {activeUnit && (
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div>
                  <span className="font-mono font-bold text-amber-400">{activeUnit.plate}</span>
                  <span className="text-zinc-300 ml-2 font-semibold">{activeUnit.brand} {activeUnit.model}</span>
                </div>
                <div className="text-left sm:text-right font-mono">
                  <span className="text-zinc-500 text-[10px] mr-2">Batas Bawah Sales:</span>
                  <span className="text-rose-400 font-bold">{formatIDR(eco.minPrice)}</span>
                </div>
              </div>
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
                  {salesStaffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      👤 {staff.name} ({staff.role.toUpperCase()})
                    </option>
                  ))}
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
                  Nominal Komisi Sales *
                </label>
                
                {/* Preset Quick Buttons: 100rb, 200rb, 350rb, Custom */}
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCommissionAmount(100000);
                      setIsCustomCommission(false);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center font-mono text-[11px] font-bold transition-all ${
                      commissionAmount === 100000 && !isCustomCommission
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    100 Rb
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCommissionAmount(200000);
                      setIsCustomCommission(false);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center font-mono text-[11px] font-bold transition-all ${
                      commissionAmount === 200000 && !isCustomCommission
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    200 Rb
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCommissionAmount(350000);
                      setIsCustomCommission(false);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center font-mono text-[11px] font-bold transition-all ${
                      commissionAmount === 350000 && !isCustomCommission
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    350 Rb
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCommission(true);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center font-mono text-[11px] font-bold transition-all ${
                      isCustomCommission
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {isCustomCommission ? (
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-zinc-500">Rp</span>
                    <input
                      type="number"
                      placeholder="Masukkan nominal komisi"
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-amber-500/60 text-emerald-400 font-mono font-bold text-xs focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Komisi Disetel:</span>
                    <span className="font-mono font-bold text-emerald-400">{formatIDR(commissionAmount)}</span>
                  </div>
                )}
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
                  value={new Intl.NumberFormat('id-ID').format(dealPrice)}
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
                      value={new Intl.NumberFormat('id-ID').format(dpAmount)}
                      onChange={(e) => setDpAmount(Number(e.target.value.replace(/[^0-9]/g, '')))}
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
    </div>
  );
}
