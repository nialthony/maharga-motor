import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import SalesPOS from './components/SalesPOS';
import TempoMonitor from './components/TempoMonitor';
import WorkshopService from './components/WorkshopService';
import OwnerFinancialReport from './components/OwnerFinancialReport';
import SalesCommissionReport from './components/SalesCommissionReport';
import EmployeeManagement from './components/EmployeeManagement';
import AdminPanel from './components/AdminPanel';
import AdminLoginModal from './components/AdminLoginModal';
import UnitDetailModal from './components/UnitDetailModal';
import DocumentPrintModal from './components/DocumentPrintModal';
import NewUnitModal from './components/NewUnitModal';
import LoginScreen from './components/LoginScreen';
import UserProfileModal from './components/UserProfileModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import RoleBadge from './components/RoleBadge';

import { supabase } from './lib/supabaseClient';
import { 
  initialUnits, 
  initialSalesList, 
  initialEmployees,
  initialMechanics,
  initialBrands,
  initialTypes,
  initialSettings
} from './data/mockData';
import { 
  fetchCloudData, 
  syncAllToCloud, 
  saveNewUnitToCloud, 
  saveTransactionToCloud, 
  saveSettlementToCloud,
  saveEmployeeProfileToCloud,
  deleteEmployeeFromCloud,
  subscribeToCloudRealtime,
  saveSystemSettingsToCloud,
  saveMasterTypesToCloud,
  updateUnitStatusInCloud,
  unitFromDb,
  describeDbError
} from './lib/cloudStore';

export default function App() {
  // Penghitung penulisan ke cloud yang sedang berjalan. Selama > 0, refetch realtime
  // ditahan agar snapshot server (yang belum memuat data baru) tidak menimpa state
  // lokal — inilah yang membuat unit baru "tampil lalu hilang" sebelum refresh.
  const pendingWritesRef = useRef(0);

  // Load initial states from localStorage if available, fallback to mockData
  const [units, setUnits] = useState(() => {
    try {
      const saved = localStorage.getItem('maharga_units_v3_clean');
      return saved !== null ? JSON.parse(saved) : initialUnits;
    } catch {
      return initialUnits;
    }
  });

  const [salesList, setSalesList] = useState(() => {
    try {
      const saved = localStorage.getItem('maharga_sales_v3_clean');
      return saved !== null ? JSON.parse(saved) : initialSalesList;
    } catch {
      return initialSalesList;
    }
  });

  const [employees, setEmployees] = useState(() => {
    try {
      const saved = localStorage.getItem('maharga_employees_v3_clean');
      return saved !== null ? JSON.parse(saved) : initialEmployees;
    } catch {
      return initialEmployees;
    }
  });

  const [brands, setBrands] = useState(() => {
    try {
      const saved = localStorage.getItem('maharga_brands_v3');
      return saved !== null ? JSON.parse(saved) : initialBrands;
    } catch {
      return initialBrands;
    }
  });

  const [types, setTypes] = useState(() => {
    try {
      const saved = localStorage.getItem('maharga_types_v3');
      return saved !== null ? JSON.parse(saved) : initialTypes;
    } catch {
      return initialTypes;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('maharga_settings_v3');
      return saved !== null ? JSON.parse(saved) : initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const [mechanics] = useState(initialMechanics);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('syncing'); // 'synced' | 'syncing' | 'offline'

  // Sync to localStorage as fast local cache
  useEffect(() => {
    try {
      localStorage.setItem('maharga_units_v3_clean', JSON.stringify(units));
    } catch (e) {
      console.warn('localStorage sync error', e);
    }
  }, [units]);

  useEffect(() => {
    try {
      localStorage.setItem('maharga_sales_v3_clean', JSON.stringify(salesList));
    } catch (e) {
      console.warn('localStorage sync error', e);
    }
  }, [salesList]);

  useEffect(() => {
    try {
      localStorage.setItem('maharga_employees_v3_clean', JSON.stringify(employees));
    } catch (e) {
      console.warn('localStorage sync error for employees', e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem('maharga_brands_v3', JSON.stringify(brands));
    } catch (e) {
      console.warn('localStorage sync error for brands', e);
    }
  }, [brands]);

  useEffect(() => {
    try {
      localStorage.setItem('maharga_types_v3', JSON.stringify(types));
    } catch (e) {
      console.warn('localStorage sync error for types', e);
    }
  }, [types]);

  useEffect(() => {
    try {
      localStorage.setItem('maharga_settings_v3', JSON.stringify(settings));
    } catch (e) {
      console.warn('localStorage sync error for settings', e);
    }
  }, [settings]);

  // Reusable Auto Fetch function for cloud database
  const refreshCloudData = async () => {
    try {
      const cloudData = await fetchCloudData();
      if (cloudData) {
        if (Array.isArray(cloudData.units)) setUnits(cloudData.units);
        if (Array.isArray(cloudData.salesList)) setSalesList(cloudData.salesList);
        if (Array.isArray(cloudData.employees) && cloudData.employees.length > 0) setEmployees(cloudData.employees);
        setCloudSyncStatus('synced');
      } else {
        setCloudSyncStatus('offline');
      }
    } catch (err) {
      console.warn('Gagal memuat data cloud:', err);
      setCloudSyncStatus('offline');
    }
  };

  // Cloud Sync on Mount & Realtime Subscription across all devices
  useEffect(() => {
    let isMounted = true;

    // 1. Auto fetch data dari Supabase Cloud saat mount
    fetchCloudData()
      .then((cloudData) => {
        if (!isMounted) return;
        if (cloudData) {
          if (Array.isArray(cloudData.units)) setUnits(cloudData.units);
          if (Array.isArray(cloudData.salesList)) setSalesList(cloudData.salesList);
          if (Array.isArray(cloudData.employees) && cloudData.employees.length > 0) setEmployees(cloudData.employees);
          setCloudSyncStatus('synced');
        } else {
          setCloudSyncStatus('offline');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Gagal memuat data cloud:', err);
        setCloudSyncStatus('offline');
      });

    // 2. Subscribe to realtime changes from other devices (safely guarded)
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToCloudRealtime((remoteData) => {
        // Tahan pembaruan realtime saat masih ada proses simpan yang berjalan.
        if (pendingWritesRef.current > 0) return;
        if (isMounted && remoteData) {
          if (Array.isArray(remoteData.units)) setUnits(remoteData.units);
          if (Array.isArray(remoteData.salesList)) setSalesList(remoteData.salesList);
          if (Array.isArray(remoteData.employees) && remoteData.employees.length > 0) setEmployees(remoteData.employees);
          setCloudSyncStatus('synced');
        }
      });
    } catch (e) {
      console.warn('Realtime subscription bypassed:', e);
    }

    // 3. Listener event login Supabase untuk auto-fetch instan tanpa refresh
    let authListener = null;
    try {
      if (supabase) {
        const { data } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            refreshCloudData();
          }
        });
        authListener = data;
      }
    } catch (authErr) {
      console.warn('Auth state change listener bypassed:', authErr);
    }

    return () => {
      isMounted = false;
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (e) {
        console.warn('Realtime unsubscribe cleanup error:', e);
      }
      try {
        authListener?.subscription?.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, []);

  // Active User session (default: null -> Show Login Screen)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('maharga_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewUnitModalOpen, setIsNewUnitModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  // Handlers with Cloud Push
  const handleSelectUnit = (unit) => {
    setSelectedUnit(unit);
    setIsDetailModalOpen(true);
  };

  const handlePrintReceipt = (transactionOrUnit) => {
    if (!transactionOrUnit) return;
    // Jika parameter adalah objek transaksi penjualan
    if (transactionOrUnit.dealPrice !== undefined) {
      setCurrentTransaction(transactionOrUnit);
      setIsPrintModalOpen(true);
      return;
    }
    // Jika parameter adalah unit motor, cari transaksi di salesList
    const matchedTx = salesList.find(s => s.unitId === transactionOrUnit.id || s.plate === transactionOrUnit.plate);
    if (matchedTx) {
      setCurrentTransaction(matchedTx);
      setIsPrintModalOpen(true);
      return;
    }
    // Fallback kwitansi untuk unit terjual
    const synthTx = {
      id: `TX-${transactionOrUnit.id || Date.now().toString().slice(-6)}`,
      unitId: transactionOrUnit.id,
      unitName: `${transactionOrUnit.brand || ''} ${transactionOrUnit.model || 'Unit Motor'}`.trim(),
      plate: transactionOrUnit.plate || '-',
      dealPrice: transactionOrUnit.displayPrice || 0,
      buyerName: transactionOrUnit.buyerName || 'Konsumen Showroom',
      buyerPhone: transactionOrUnit.buyerPhone || '-',
      buyerAddress: transactionOrUnit.buyerAddress || 'Klaten',
      paymentMethod: 'cash',
      paymentType: 'Cash Lunas',
      date: transactionOrUnit.soldDate || new Date().toISOString().split('T')[0],
      salesName: transactionOrUnit.salesName || 'Admin Showroom'
    };
    setCurrentTransaction(synthTx);
    setIsPrintModalOpen(true);
  };

  const handleOpenPOS = (unit) => {
    if (currentUser?.role !== 'owner' && currentUser?.role !== 'admin') {
      alert('Kasir hanya dapat diakses oleh Owner dan Admin Showroom.');
      return;
    }
    setSelectedUnit(unit);
    setActiveTab('pos');
  };

  const handleTransactionComplete = (newTx, unitId, newStatus) => {
    const updatedUnits = units.map(u => u.id === unitId ? { ...u, status: newStatus } : u);
    const updatedSales = [newTx, ...salesList];
    setUnits(updatedUnits);
    setSalesList(updatedSales);
    setCurrentTransaction(newTx);
    setIsPrintModalOpen(true);

    // Kirim langsung ke Supabase Cloud — laporan error wajib terlihat karena ini data uang.
    pendingWritesRef.current += 1;
    saveTransactionToCloud(newTx, unitId, newStatus)
      .then((res) => {
        if (res && res.ok === false) {
          alert(`Transaksi tersimpan sebagian:\n\n${(res.errors || []).join('\n')}`);
        }
      })
      .catch((err) => {
        console.error('Gagal upload transaksi ke cloud:', err);
        alert(`Transaksi TIDAK tersimpan ke database:\n\n${describeDbError(err) || err.message}`);
      })
      .finally(() => {
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
      });
  };

  const handleAddRepair = async (unitId, repair) => {
    const updatedUnits = units.map(u => {
      if (u.id === unitId) {
        const updatedRepairs = [repair, ...(u.repairs || [])];
        const updatedRepairCost = (u.repairCost || 0) + repair.cost;
        return {
          ...u,
          repairCost: updatedRepairCost,
          repairs: updatedRepairs
        };
      }
      return u;
    });
    setUnits(updatedUnits);

    // Kirim langsung ke tabel repairs & update repair_cost tabel units.
    // HPP unit bergantung pada ini, jadi kegagalan tidak boleh dibiarkan senyap.
    if (supabase) {
      const { error: repairErr } = await supabase.from('repairs').insert([{
        unit_id: unitId,
        repair_date: repair.date || new Date().toISOString().split('T')[0],
        item: repair.item,
        mechanic_name: repair.mechanic,
        cost: Math.max(0, Number(repair.cost) || 0)
      }]);

      if (repairErr) {
        console.error('Gagal simpan data servis ke Supabase:', repairErr);
        alert(`Catatan servis TIDAK tersimpan ke database:\n\n${describeDbError(repairErr)}`);
        return;
      }

      const targetUnit = updatedUnits.find(u => u.id === unitId);
      if (targetUnit) {
        const { error: costErr } = await supabase.from('units').update({ 
          repair_cost: targetUnit.repairCost 
        }).eq('id', unitId);

        if (costErr) {
          console.error('Gagal update repair_cost ke Supabase:', costErr);
          alert(`Biaya servis tersimpan, tetapi total HPP unit gagal diperbarui:\n\n${describeDbError(costErr)}`);
        }
      }
    }
  };

  const handleUpdateUnitStatus = async (unitId, newStatus) => {
    const previousUnits = units;
    const updatedUnits = units.map(u => u.id === unitId ? { ...u, status: newStatus } : u);
    setUnits(updatedUnits);
    if (selectedUnit && selectedUnit.id === unitId) {
      setSelectedUnit(prev => ({ ...prev, status: newStatus }));
    }

    pendingWritesRef.current += 1;
    try {
      // Alur "Unit Masuk > Bengkel > Tersedia" harus benar-benar tersimpan,
      // bukan gagal diam-diam karena CHECK constraint.
      await updateUnitStatusInCloud(unitId, newStatus);
      setCloudSyncStatus('synced');
    } catch (err) {
      console.error('Gagal update status unit di database:', err);
      setUnits(previousUnits);
      setSelectedUnit(prev => (prev && prev.id === unitId ? { ...prev, status: previousUnits.find(u => u.id === unitId)?.status } : prev));
      const detail = describeDbError(err) || err.message;
      setCloudSyncStatus('offline');
      alert(`Status unit TIDAK tersimpan ke database:\n\n${detail}`);
    } finally {
      pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
    }
  };

  const handleAddUnit = async (newUnit) => {
    // Simpan snapshot untuk rollback bila database menolak data.
    const previousUnits = units;

    // Tampilkan optimistis supaya UI terasa instan.
    setUnits([newUnit, ...units]);
    setActiveTab('inventory');

    pendingWritesRef.current += 1;
    try {
      // WAJIB di-await: tanpa ini error database tidak pernah terlihat dan unit
      // hanya "hidup" di localStorage sampai halaman di-refresh.
      const savedRow = await saveNewUnitToCloud(newUnit);

      // Sinkronkan baris hasil server (ID bisa berubah jika terjadi retry bentrok).
      const syncedUnit = unitFromDb(savedRow, []);
      setUnits(prev => prev.map(u => (u.id === newUnit.id ? { ...u, ...syncedUnit } : u)));
      setCloudSyncStatus('synced');
      return { ok: true };
    } catch (err) {
      console.error('Gagal menyimpan unit baru ke database:', err);
      // Rollback: jangan pernah meninggalkan unit "hantu" di katalog.
      setUnits(previousUnits);
      setCloudSyncStatus('offline');
      return { ok: false, message: describeDbError(err) || err.message || 'Gagal menyimpan unit ke database.' };
    } finally {
      pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
    }
  };

  const handlePayRemaining = (txId) => {
    const targetTx = salesList.find(tx => tx.id === txId);
    const updatedSales = salesList.map(tx => {
      if (tx.id === txId) {
        return {
          ...tx,
          status: 'Lunas',
          remainingAmount: 0,
          remainingPayment: 0
        };
      }
      return tx;
    });

    // Otomatis ubah status unit motor menjadi 'Terjual'
    const targetUnitId = targetTx?.unitId;
    const targetPlate = targetTx?.plate;
    const updatedUnits = units.map(u => {
      if ((targetUnitId && u.id === targetUnitId) || (targetPlate && u.plate === targetPlate)) {
        return {
          ...u,
          status: 'Terjual'
        };
      }
      return u;
    });

    setSalesList(updatedSales);
    setUnits(updatedUnits);

    // Kirim update pelunasan ke Supabase Cloud
    pendingWritesRef.current += 1;
    saveSettlementToCloud(txId, targetUnitId)
      .then((res) => {
        if (res && res.ok === false) {
          alert(`Pelunasan tidak sepenuhnya tersimpan:\n\n${(res.errors || []).join('\n')}`);
        }
      })
      .catch((err) => {
        console.error('Gagal simpan pelunasan ke cloud:', err);
        alert(`Pelunasan TIDAK tersimpan ke database:\n\n${describeDbError(err) || err.message}`);
      })
      .finally(() => {
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
      });
  };

  const handleCancelTempo = (txId) => {
    const targetTx = salesList.find(tx => tx.id === txId);
    if (!targetTx) return;

    const confirmCancel = window.confirm(
      `Batalkan transaksi tempo untuk ${targetTx.plate || 'unit ini'}?\n\nUnit akan dikembalikan ke status 'Tersedia' dan transaksi akan dihapus.`
    );
    if (!confirmCancel) return;

    const updatedSales = salesList.filter(tx => tx.id !== txId);
    const targetUnitId = targetTx.unitId;
    const targetPlate = targetTx.plate;
    const updatedUnits = units.map(u => {
      if ((targetUnitId && u.id === targetUnitId) || (targetPlate && u.plate === targetPlate)) {
        return {
          ...u,
          status: 'Tersedia'
        };
      }
      return u;
    });

    setSalesList(updatedSales);
    setUnits(updatedUnits);

    // syncAllToCloud tidak melempar error, tetapi melaporkan daftar kegagalan.
    pendingWritesRef.current += 1;
    syncAllToCloud(updatedUnits, updatedSales, employees)
      .then((res) => {
        if (res && res.ok === false) {
          alert(`Pembatalan tempo tidak sepenuhnya tersimpan:\n\n${(res.errors || []).join('\n')}`);
        }
      })
      .finally(() => {
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
      });
  };

  const handleSaveMasterTypes = async (newBrands, newTypes) => {
    setBrands(newBrands);
    setTypes(newTypes);
    try {
      await saveMasterTypesToCloud(newBrands, newTypes);
    } catch (err) {
      console.warn('Failed to sync master types to cloud:', err);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    try {
      await saveSystemSettingsToCloud(newSettings);
    } catch (err) {
      console.warn('Failed to sync settings to cloud:', err);
    }
  };

  const isOwnerOrAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const handleOpenAdminPanel = () => {
    if (isOwnerOrAdmin) {
      setIsAdminPanelOpen(true);
    }
  };

  const handleOpenNewUnit = () => {
    if (isOwnerOrAdmin) {
      setIsNewUnitModalOpen(true);
    }
  };

  const handleUpdateProfile = async (updatedUser) => {
    setCurrentUser(updatedUser);
    try {
      sessionStorage.setItem('maharga_auth_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('sessionStorage update error', e);
    }

    const nextEmployees = employees.map(emp => emp.id === updatedUser.id ? updatedUser : emp);
    setEmployees(nextEmployees);

    await saveEmployeeProfileToCloud(updatedUser, nextEmployees, units, salesList);
  };

  const handleUpdateEmployees = (updaterOrArray) => {
    // Side-effect tidak boleh berada di dalam updater setState: React memanggilnya
    // dua kali (StrictMode) sehingga data terkirim ganda dan berpotensi tertimpa.
    const nextEmployees = typeof updaterOrArray === 'function' ? updaterOrArray(employees) : updaterOrArray;
    setEmployees(nextEmployees);
    void syncAllToCloud(units, salesList, nextEmployees);
  };

  const handleDeleteEmployee = async (empToDelete) => {
    try {
      await deleteEmployeeFromCloud(empToDelete);
      const targetId = typeof empToDelete === 'object' ? empToDelete.id : empToDelete;
      const targetUsername = typeof empToDelete === 'object' ? empToDelete.username : empToDelete;
      setEmployees(prev => {
        const next = prev.filter(e => e.id !== targetId && e.username !== targetUsername);
        try {
          localStorage.setItem('maharga_employees', JSON.stringify(next));
        } catch (e) {
          console.warn('localStorage error', e);
        }
        return next;
      });
      return true;
    } catch (err) {
      console.error('Gagal menghapus staf dari cloud:', err);
      throw err;
    }
  };

  const handleLoginSuccess = (user) => {
    try {
      sessionStorage.setItem('maharga_auth_user', JSON.stringify(user));
    } catch (e) {
      console.warn('sessionStorage error', e);
    }
    setCurrentUser(user);
    setActiveTab('dashboard');
    setIsAdminPanelOpen(false);
    setIsLoginModalOpen(false);

    // Otomatis fetch database langsung setelah login berhasil
    refreshCloudData();
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('maharga_auth_user');
      // Bersihkan cache data bisnis sensitif dari browser saat logout (keamanan perangkat bersama)
      localStorage.removeItem('maharga_units_v3_clean');
      localStorage.removeItem('maharga_sales_v3_clean');
      localStorage.removeItem('maharga_employees_v3_clean');
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Logout error', e);
    }
    setCurrentUser(null);
    setUnits([]);
    setSalesList([]);
    setIsAdminPanelOpen(false);
    setIsLoginModalOpen(false);
  };

  // Tampilkan Login Screen jika belum login
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const isUnitSold = (u) => {
    if (!u) return false;
    const st = (u.status || '').toLowerCase();
    if (st === 'terjual' || st === 'sold' || st === 'tempo aktif' || st === 'lunas') return true;
    if (salesList.some(s => (s.unitId && s.unitId === u.id) || (u.plate && s.plate && s.plate.toLowerCase() === u.plate.toLowerCase()))) return true;
    return false;
  };

  const readyCount = units.filter(u => (u.status === 'Tersedia' || u.status === 'Ready') && !isUnitSold(u)).length;
  const repairCount = units.filter(u => {
    if (isUnitSold(u)) return false;
    const st = (u.status || '').toLowerCase();
    return st === 'perbaikan' || st === 'servis' || st === 'workshop' || st === 'belum tersedia';
  }).length;
  const tempoAlertCount = salesList.filter(s => s.paymentMethod === 'dp-tempo' && s.status === 'Tempo Aktif').length;

  // Dedicated Admin Panel Full View (Hanya untuk Owner dan Admin)
  if (isAdminPanelOpen && isOwnerOrAdmin) {
    return (
      <AdminPanel
        units={units}
        setUnits={setUnits}
        salesList={salesList}
        setSalesList={setSalesList}
        employees={employees}
        currentUser={currentUser}
        onBackToERP={() => setIsAdminPanelOpen(false)}
        brands={brands}
        setBrands={setBrands}
        types={types}
        setTypes={setTypes}
        onSaveMasterTypes={handleSaveMasterTypes}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-amber-400 selection:text-zinc-950">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenNewUnit={handleOpenNewUnit}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAdminPanel={handleOpenAdminPanel}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        availableCount={readyCount}
        repairCount={repairCount}
        tempoAlertCount={tempoAlertCount}
        cloudSyncStatus={cloudSyncStatus}
        onLogout={() => setIsLogoutConfirmOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-5">
        {activeTab === 'dashboard' && (
          <Dashboard
            units={units}
            salesList={salesList}
            role={currentUser.role}
            setActiveTab={setActiveTab}
            onSelectUnit={handleSelectUnit}
            onOpenPOS={handleOpenPOS}
            onOpenNewUnit={handleOpenNewUnit}
            employees={employees}
            settings={settings}
            onPrintReceipt={handlePrintReceipt}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory
            units={units}
            role={currentUser.role}
            onSelectUnit={handleSelectUnit}
            onOpenPOS={handleOpenPOS}
            onOpenNewUnit={handleOpenNewUnit}
            onPrintReceipt={handlePrintReceipt}
          />
        )}

        {activeTab === 'pos' && (
          (currentUser.role === 'owner' || currentUser.role === 'admin') ? (
            <SalesPOS
              units={units}
              selectedUnit={selectedUnit}
              setSelectedUnit={setSelectedUnit}
              salesList={salesList}
              onTransactionComplete={handleTransactionComplete}
              currentUser={currentUser}
              employees={employees}
              onOpenNewUnit={() => setIsNewUnitModalOpen(true)}
              onPrintReceipt={handlePrintReceipt}
              onSelectUnit={handleSelectUnit}
            />
          ) : (
            <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md mx-auto my-12 space-y-3">
              <h3 className="text-base font-bold text-zinc-100">Akses Terbatas</h3>
              <p className="text-xs text-zinc-400">Modul kasir hanya dapat diakses oleh Owner dan Admin Showroom.</p>
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition-colors"
              >
                Kembali ke Dashboard
              </button>
            </div>
          )
        )}

        {activeTab === 'tempo' && (
          <TempoMonitor
            salesList={salesList}
            onPayRemaining={handlePayRemaining}
            onCancelTempo={handleCancelTempo}
            onPrintReceipt={handlePrintReceipt}
          />
        )}

        {activeTab === 'workshop' && (
          <WorkshopService
            units={units}
            salesList={salesList}
            onAddRepair={handleAddRepair}
            onUpdateUnitStatus={handleUpdateUnitStatus}
            mechanics={mechanics}
            employees={employees}
          />
        )}

        {/* Owner Financial & Payroll View */}
        {activeTab === 'financial_report' && (
          <OwnerFinancialReport
            salesList={salesList}
            employees={employees}
            units={units}
            onPrintReceipt={handlePrintReceipt}
          />
        )}

        {/* Sales Personal Commission View */}
        {activeTab === 'my_commission' && (
          <SalesCommissionReport
            salesList={salesList}
            currentUser={currentUser}
            onPrintReceipt={handlePrintReceipt}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeManagement
            employees={employees}
            setEmployees={handleUpdateEmployees}
            onDeleteEmployee={handleDeleteEmployee}
            currentRole={currentUser.role}
            onSwitchUser={setCurrentUser}
          />
        )}
      </main>

      {/* Modals */}
      {isDetailModalOpen && (
        <UnitDetailModal
          unit={selectedUnit}
          salesList={salesList}
          role={currentUser.role}
          onClose={() => setIsDetailModalOpen(false)}
          onOpenPOS={handleOpenPOS}
          onPrintReceipt={handlePrintReceipt}
          onUpdateUnitStatus={handleUpdateUnitStatus}
        />
      )}

      {isPrintModalOpen && (
        <DocumentPrintModal
          transaction={currentTransaction}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {isNewUnitModalOpen && (
        <NewUnitModal
          isOpen={isNewUnitModalOpen}
          onClose={() => setIsNewUnitModalOpen(false)}
          onAddUnit={handleAddUnit}
          brands={brands}
          types={types}
        />
      )}

      {isLoginModalOpen && (
        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onSaveProfile={handleUpdateProfile}
          onSwitchAccount={() => {
            setIsProfileModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
      )}

      {isLogoutConfirmOpen && (
        <LogoutConfirmModal
          isOpen={isLogoutConfirmOpen}
          onClose={() => setIsLogoutConfirmOpen(false)}
          onConfirm={() => {
            setIsLogoutConfirmOpen(false);
            handleLogout();
          }}
          currentUser={currentUser}
        />
      )}

      {/* Clean Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs text-zinc-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 <strong>Maharga Motor Showroom System</strong> • Cash & Titip DP Management.</p>
          <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span>Login: {currentUser.name}</span>
              <RoleBadge role={currentUser.role} className="h-4 sm:h-5 w-auto" />
            </div>
            {isOwnerOrAdmin && (
              <span>
                Admin Suite:{' '}
                <button 
                  onClick={handleOpenAdminPanel} 
                  className="text-amber-400 font-bold hover:underline"
                >
                  Buka Admin Panel
                </button>
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
