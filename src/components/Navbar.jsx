import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  CreditCard, 
  Clock, 
  Wrench, 
  BarChart3, 
  Plus, 
  Users, 
  KeyRound, 
  Menu, 
  X, 
  DollarSign,
  Settings
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser,
  onOpenNewUnit,
  onOpenLoginModal,
  onOpenAdminPanel,
  availableCount,
  tempoAlertCount 
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';
  const isSales = currentUser.role === 'sales';

  // Role-Specific Navigation Architecture
  const ownerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Stok & HPP', icon: Layers, badge: availableCount },
    { id: 'pos', label: 'Kasir', icon: CreditCard },
    { id: 'tempo', label: 'Piutang DP', icon: Clock, badge: tempoAlertCount, badgeColor: 'bg-amber-500' },
    { id: 'workshop', label: 'Bengkel', icon: Wrench },
    { id: 'financial_report', label: 'Keuangan & Komisi Sales', icon: DollarSign },
    { id: 'employees', label: 'Karyawan', icon: Users },
    { id: 'admin_panel', label: 'Admin Panel', icon: Settings, special: true }
  ];

  const salesNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Katalog Unit', icon: Layers, badge: availableCount },
    { id: 'pos', label: 'Kasir Jual', icon: CreditCard },
    { id: 'tempo', label: 'Piutang DP', icon: Clock, badge: tempoAlertCount, badgeColor: 'bg-amber-500' },
    { id: 'my_commission', label: 'Komisi Saya', icon: BarChart3 }
  ];

  const currentNavItems = isOwnerOrAdmin ? ownerNavItems : salesNavItems;

  const handleNavClick = (id) => {
    if (id === 'admin_panel') {
      onOpenAdminPanel();
    } else {
      setActiveTab(id);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400 font-bold text-sm tracking-wider font-mono shrink-0">
                MM
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-zinc-100 tracking-tight font-mono">
                    MAHARGA MOTOR
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                    isOwnerOrAdmin ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {currentUser.role.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 truncate max-w-[170px] sm:max-w-none">
                  {isOwnerOrAdmin ? 'Portal Manajemen Showroom' : 'Sales Portal'}
                </p>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="flex items-center gap-2">
              {isOwnerOrAdmin && (
                <button
                  onClick={onOpenAdminPanel}
                  className="hidden md:flex px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 font-bold text-xs shadow-sm transition-all items-center gap-1.5"
                  title="Buka Admin Panel (Kelola Foto, File, Database)"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Admin Panel
                </button>
              )}

              {currentUser.role === 'owner' && (
                <button
                  onClick={onOpenNewUnit}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  Input Unit
                </button>
              )}

              {/* User Switcher */}
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-left"
                title="Ganti Akun"
              >
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-amber-400 font-mono">
                  {currentUser.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:block">
                  <span className="font-semibold text-zinc-200 block text-xs leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono uppercase">
                    {currentUser.role}
                  </span>
                </div>
                <KeyRound className="w-3 h-3 text-zinc-500" />
              </button>

              {/* Mobile Drawer Trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white md:hidden"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Tabs Bar */}
        <div className="hidden md:block border-t border-zinc-800 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 overflow-x-auto py-1.5 no-scrollbar">
              {currentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700 shadow-sm'
                        : item.special
                        ? 'text-amber-400 hover:bg-zinc-900 border border-amber-500/20'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : item.special ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                          item.badgeColor
                            ? `${item.badgeColor} text-zinc-950`
                            : isActive
                            ? 'bg-zinc-900 text-zinc-200 border border-zinc-700'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Drawer / Slide Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-zinc-950/90 backdrop-blur-md flex flex-col pt-16 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 font-mono font-bold text-xs">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-100">{currentUser.name}</h4>
                <span className="text-[10px] text-amber-400 font-mono uppercase">{currentUser.role}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1 overflow-y-auto flex-1">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-900 text-zinc-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-2">
            {currentUser.role === 'owner' && (
              <button
                onClick={() => {
                  onOpenNewUnit();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Input Unit Motor Baru
              </button>
            )}
            <button
              onClick={() => {
                onOpenLoginModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold"
            >
              Ganti Pengguna (Login)
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Sticky App Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            activeTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Ringkasan</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            activeTab === 'inventory' ? 'text-amber-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Katalog</span>
        </button>

        <button
          onClick={() => setActiveTab('pos')}
          className="flex flex-col items-center py-1 px-3 rounded-lg bg-amber-500 text-zinc-950 font-bold shadow-sm"
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[10px]">Kasir</span>
        </button>

        {isSales ? (
          <button
            onClick={() => setActiveTab('my_commission')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
              activeTab === 'my_commission' ? 'text-amber-400 font-bold' : 'text-zinc-400'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Komisi</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('financial_report')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
              activeTab === 'financial_report' ? 'text-amber-400 font-bold' : 'text-zinc-400'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Keuangan</span>
          </button>
        )}

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center py-1 px-2 rounded-lg text-zinc-400"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </div>
    </>
  );
}
