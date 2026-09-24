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

import { 
  initialUnits, 
  initialSalesList, 
  initialEmployees,
  initialFiles,
  initialMechanics 
} from './data/mockData';

export default function App() {
  // Load initial states from localStorage if available, fallback to mockData (empty for production)
  const [units, setUnits] = useState(() => {
    try {
      const saved = localStorage.getItem('maharga_units_v3_clean');
      return saved ? JSON.parse(saved) : initialUnits;
    } catch {
      return initialUnits;
    }
  });

  const [salesList, setSalesList] = useState(() => {
    try {
      const saved = localStorage.getItem('maharga_sales_v3_clean');
      return saved ? JSON.parse(saved) : initialSalesList;
    } catch {
      return initialSalesList;
    }
  });

  const [employees, setEmployees] = useState(initialEmployees);
  const [files, setFiles] = useState(initialFiles);
  const [mechanics] = useState(initialMechanics);

  // Sync to localStorage
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

  // Active User session (default Owner)
  const [currentUser, setCurrentUser] = useState(initialEmployees[0]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewUnitModalOpen, setIsNewUnitModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  // Handlers
  const handleSelectUnit = (unit) => {
    setSelectedUnit(unit);
    setIsDetailModalOpen(true);
  };

  const handleOpenPOS = (unit) => {
    setSelectedUnit(unit);
    setActiveTab('pos');
  };

  const handleTransactionComplete = (newTx, unitId, newStatus) => {
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, status: newStatus } : u));
    setSalesList(prev => [newTx, ...prev]);
    setCurrentTransaction(newTx);
    setIsPrintModalOpen(true);
  };

  const handleAddRepair = (unitId, repair) => {
    setUnits(prev => prev.map(u => {
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
    }));
  };

  const handleAddUnit = (newUnit) => {
    setUnits(prev => [newUnit, ...prev]);
    setActiveTab('inventory');
  };

  const handlePayRemaining = (txId) => {
    setSalesList(prev => prev.map(tx => {
      if (tx.id === txId) {
        return {
          ...tx,
          status: 'Lunas',
          remainingAmount: 0
        };
      }
      return tx;
    }));
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    setIsAdminPanelOpen(false);
  };

  const readyCount = units.filter(u => u.status === 'Tersedia').length;
  const tempoAlertCount = salesList.filter(s => s.paymentMethod === 'dp-tempo' && s.status === 'Tempo Aktif').length;

  // Dedicated Admin Panel Full View
  if (isAdminPanelOpen) {
    return (
      <AdminPanel
        units={units}
        setUnits={setUnits}
        salesList={salesList}
        setSalesList={setSalesList}
        employees={employees}
        files={files}
        setFiles={setFiles}
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
        onOpenNewUnit={() => setIsNewUnitModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        availableCount={readyCount}
        tempoAlertCount={tempoAlertCount}
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
            onOpenNewUnit={() => setIsNewUnitModalOpen(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory
            units={units}
            role={currentUser.role}
            onSelectUnit={handleSelectUnit}
            onOpenPOS={handleOpenPOS}
            onOpenNewUnit={() => setIsNewUnitModalOpen(true)}
          />
        )}

        {activeTab === 'pos' && (
          <SalesPOS
            units={units}
            selectedUnit={selectedUnit}
            setSelectedUnit={setSelectedUnit}
            onTransactionComplete={handleTransactionComplete}
            currentUser={currentUser}
            employees={employees}
            onOpenNewUnit={() => setIsNewUnitModalOpen(true)}
          />
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
            setEmployees={setEmployees}
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
          employees={employees}
        />
      )}

      {/* Clean Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs text-zinc-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 <strong>Maharga Motor Showroom System</strong> • Cash & Titip DP Management.</p>
          <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
            <span>Login: {currentUser.name} ({currentUser.role.toUpperCase()})</span>
            <span>Admin Suite: <button onClick={() => setIsAdminPanelOpen(true)} className="text-amber-400 font-bold hover:underline">Buka Admin Panel</button></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
