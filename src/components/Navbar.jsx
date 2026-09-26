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
  User,
  Menu, 
  X, 
  DollarSign,
  Settings,
  LogOut
} from 'lucide-react';
import RoleBadge from './RoleBadge';
import { ThemeToggle } from './ui/theme-toggle';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser,
  onOpenNewUnit,
  onOpenAdminPanel,
  onOpenProfile,
  availableCount,
  tempoAlertCount,
  onLogout
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';
  const isSales = currentUser.role === 'sales';
  const isMechanic = currentUser.role === 'mechanic' || currentUser.role === 'mekanik';

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
    { id: 'tempo', label: 'Piutang DP', icon: Clock, badge: tempoAlertCount, badgeColor: 'bg-amber-500' },
    { id: 'my_commission', label: 'Komisi Saya', icon: BarChart3 }
  ];

  const mechanicNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Katalog Unit', icon: Layers, badge: availableCount },
    { id: 'workshop', label: 'Bengkel & Servis', icon: Wrench },
    { id: 'my_commission', label: 'Komisi Saya', icon: BarChart3 }
  ];

  const currentNavItems = isOwnerOrAdmin 
    ? ownerNavItems 
    : isMechanic 
    ? mechanicNavItems 
    : salesNavItems;

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
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center focus:outline-none"
                aria-label="Kembali ke Dashboard"
              >
                <img 
                  src="/logo.png" 
                  alt="Maharga Motor Logo" 
                  className="h-8 sm:h-9 w-auto object-contain transition-transform hover:scale-105"
                />
              </button>
              <div className="flex items-center gap-1.5">
                <RoleBadge role={currentUser.role} className="h-5 sm:h-6 w-auto" />
                <span className="hidden lg:inline text-[10px] text-zinc-500 font-mono">
                  • {isOwnerOrAdmin ? 'Portal Showroom' : 'Sales Portal'}
                </span>
              </div>
            </div>

            {/* Desktop Action Buttons: Theme Toggle, Profile & Logout */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle (Dark/Light Mode) */}
              <ThemeToggle className="scale-85 sm:scale-90 shrink-0" />

              {/* User Profile Pill */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-left group"
                title="Buka Profil Saya & Kontak WhatsApp/Email"
              >
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center text-[10px] font-bold text-amber-400 font-mono shrink-0 shadow-inner">
                  {currentUser.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{currentUser.username.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden lg:block">
                  <span className="font-semibold text-zinc-200 block text-xs leading-tight group-hover:text-amber-300 transition-colors">
                    {currentUser.name}
                  </span>
                  <RoleBadge role={currentUser.role} className="h-4 w-auto mt-0.5" />
                </div>
              </button>

              {/* Logout Button */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900/50 border border-zinc-800 transition-colors text-zinc-400 text-xs font-semibold"
                  title="Keluar dari sistem"
                  aria-label="Keluar dari sistem"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Tabs Bar - Centered */}
        <div className="hidden md:block border-t border-zinc-800 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-center space-x-1 overflow-x-auto py-1.5 no-scrollbar">
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
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenProfile?.();
              }}
              className="flex items-center gap-2.5 text-left p-1 -m-1 rounded-xl hover:bg-zinc-900 transition-colors"
              title="Edit Profil Staf"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center text-amber-400 font-mono font-bold text-xs shrink-0">
                {currentUser.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span>{currentUser.username.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <RoleBadge role={currentUser.role} className="h-4 w-auto" />
                  <span className="text-[10px] text-zinc-400">• Edit Profil</span>
                </div>
              </div>
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Items - Modern Grid Layout */}
          <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1 p-1">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex flex-col items-center justify-center p-3.5 rounded-xl text-center transition-all border ${
                    isActive 
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-bold' 
                      : 'bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 border-zinc-800/80 hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive 
                        ? 'bg-zinc-950 text-amber-400' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  <div className={`p-2.5 rounded-xl mb-1.5 ${
                    isActive ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-800/70 text-amber-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold leading-tight line-clamp-2">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-2">
            {isOwnerOrAdmin && (
              <button
                onClick={() => {
                  onOpenNewUnit();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Input Unit Motor Baru
              </button>
            )}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-300">Tema (Dark / Light)</span>
              <ThemeToggle className="scale-90" />
            </div>
            <button
              onClick={() => {
                onOpenProfile?.();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-850 transition-colors"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span>Profil Saya & Kontak</span>
            </button>
            {onLogout && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Keluar dari Sistem
              </button>
            )}
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
          <span className="text-[10px] mt-0.5">Dashboard</span>
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

        {/* Center Action: Kasir for Owner/Admin, Bengkel for Mechanic, Piutang DP for Sales */}
        {isOwnerOrAdmin && (
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg transition-all ${
              activeTab === 'pos' 
                ? 'bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-500/20' 
                : 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-[10px]">Kasir</span>
          </button>
        )}

        {isMechanic && (
          <button
            onClick={() => setActiveTab('workshop')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
              activeTab === 'workshop' ? 'text-amber-400 font-bold' : 'text-zinc-400'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Bengkel</span>
          </button>
        )}

        {isSales && (
          <button
            onClick={() => setActiveTab('tempo')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors relative ${
              activeTab === 'tempo' ? 'text-amber-400 font-bold' : 'text-zinc-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Piutang DP</span>
            {tempoAlertCount > 0 && (
              <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        )}

        {/* Keuangan ONLY for Owner/Admin. Komisi for all staff (Sales & Mechanic) */}
        {isOwnerOrAdmin ? (
          <button
            onClick={() => setActiveTab('financial_report')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
              activeTab === 'financial_report' ? 'text-amber-400 font-bold' : 'text-zinc-400'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Keuangan</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('my_commission')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
              activeTab === 'my_commission' ? 'text-amber-400 font-bold' : 'text-zinc-400'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Komisi</span>
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
