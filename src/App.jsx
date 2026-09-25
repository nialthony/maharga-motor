import React, { useState, useEffect } from 'react';
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

import { supabase } from './lib/supabaseClient';
import { 
  initialUnits, 
  initialSalesList, 
  initialEmployees,
  initialMechanics 
} from './data/mockData';
import { 
  fetchCloudData, 
  syncAllToCloud, 
  saveNewUnitToCloud, 
  saveTransactionToCloud, 
  saveSettlementToCloud,
  saveEmployeeProfileToCloud,
  subscribeToCloudRealtime 
} from './lib/cloudStore';

export default function App() {
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

  // Cloud Sync on Mount & Realtime Subscription across all devices
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch latest data from Supabase Cloud
    fetchCloudData().then(cloudData => {
      if (isMounted && cloudData) {
        if (Array.isArray(cloudData.units)) setUnits(cloudData.units);
        if (Array.isArray(cloudData.salesList)) setSalesList(cloudData.salesList);
        if (Array.isArray(cloudData.employees) && cloudData.employees.length > 0) setEmployees(cloudData.employees);
        setCloudSyncStatus('synced');
      } else if (isMounted) {
        setCloudSyncStatus('offline');
      }
    }).catch(() => {
      if (isMounted) setCloudSyncStatus('offline');
    });

    // 2. Subscribe to realtime changes from other devices
    const unsubscribe = subscribeToCloudRealtime((remoteData) => {
      if (isMounted && remoteData) {
        if (Array.isArray(remoteData.units)) setUnits(remoteData.units);
        if (Array.isArray(remoteData.salesList)) setSalesList(remoteData.salesList);
        if (Array.isArray(remoteData.employees) && remoteData.employees.length > 0) setEmployees(remoteData.employees);
        setCloudSyncStatus('synced');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
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
  const [currentTransaction, setCurrentTransaction] = useState(null);

  // Handlers with Cloud Push
  const handleSelectUnit = (unit) => {
    setSelectedUnit(unit);
    setIsDetailModalOpen(true);
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

    // Kirim langsung ke Supabase Cloud
    saveTransactionToCloud(newTx, unitId, newStatus, updatedUnits, updatedSales, employees);
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

    // Kirim langsung ke tabel repairs & update repair_cost tabel units
    if (supabase) {
      try {
        await supabase.from('repairs').insert([{
          unit_id: unitId,
          repair_date: repair.date || new Date().toISOString().split('T')[0],
          item: repair.item,
          mechanic_name: repair.mechanic,
          cost: Math.max(0, Number(repair.cost) || 0)
        }]);

        const targetUnit = updatedUnits.find(u => u.id === unitId);
        if (targetUnit) {
          await supabase.from('units').update({ 
            repair_cost: targetUnit.repairCost 
          }).eq('id', unitId);
        }
      } catch (err) {
        console.warn('Gagal simpan data servis ke Supabase:', err);
      }
    }
  };

  const handleAddUnit = (newUnit) => {
    const updatedUnits = [newUnit, ...units];
    setUnits(updatedUnits);
    setActiveTab('inventory');

    // Kirim langsung ke Supabase Cloud
    saveNewUnitToCloud(newUnit, updatedUnits, salesList, employees);
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
    saveSettlementToCloud(txId, targetUnitId, updatedUnits, updatedSales, employees);
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
    setEmployees(prev => {
      const nextEmployees = typeof updaterOrArray === 'function' ? updaterOrArray(prev) : updaterOrArray;
      syncAllToCloud(units, salesList, nextEmployees);
      return nextEmployees;
    });
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
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('maharga_auth_user');
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Logout error', e);
    }
    setCurrentUser(null);
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

  const readyCount = units.filter(u => u.status === 'Tersedia').length;
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
        onBackToERP={() => setIsAdminPanelOpen(false)}
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
        tempoAlertCount={tempoAlertCount}
        cloudSyncStatus={cloudSyncStatus}
        onLogout={handleLogout}
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
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory
            units={units}
            role={currentUser.role}
            onSelectUnit={handleSelectUnit}
            onOpenPOS={handleOpenPOS}
            onOpenNewUnit={handleOpenNewUnit}
          />
        )}

        {activeTab === 'pos' && (
          (currentUser.role === 'owner' || currentUser.role === 'admin') ? (
            <SalesPOS
              units={units}
              selectedUnit={selectedUnit}
              setSelectedUnit={setSelectedUnit}
              onTransactionComplete={handleTransactionComplete}
              currentUser={currentUser}
              employees={employees}
              onOpenNewUnit={() => setIsNewUnitModalOpen(true)}
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
          />
        )}

        {activeTab === 'workshop' && (
          <WorkshopService
            units={units}
            onAddRepair={handleAddRepair}
            mechanics={mechanics}
          />
        )}

        {/* Owner Financial & Payroll View */}
        {activeTab === 'financial_report' && (
          <OwnerFinancialReport
            salesList={salesList}
            employees={employees}
            units={units}
          />
        )}

        {/* Sales Personal Commission View */}
        {activeTab === 'my_commission' && (
          <SalesCommissionReport
            salesList={salesList}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeManagement
            employees={employees}
            setEmployees={handleUpdateEmployees}
            currentRole={currentUser.role}
            onSwitchUser={setCurrentUser}
          />
        )}
      </main>

      {/* Modals */}
      {isDetailModalOpen && (
        <UnitDetailModal
          unit={selectedUnit}
          role={currentUser.role}
          onClose={() => setIsDetailModalOpen(false)}
          onOpenPOS={handleOpenPOS}
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

      {/* Clean Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs text-zinc-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 <strong>Maharga Motor Showroom System</strong> • Cash & Titip DP Management.</p>
          <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
            <span>Login: {currentUser.name} ({currentUser.role.toUpperCase()})</span>
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
