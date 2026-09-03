import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Product from './pages/Product';
import Category from './pages/Category';
import Variant from './pages/Variant';
import Unit from './pages/Unit';
import Batch from './pages/Batch';
import Customer from './pages/Customer';
import Supplier from './pages/Supplier';
import Sales from './pages/Sales';
import Purchase from './pages/Purchase';
import Partner from './pages/Partner';
import PartnerLedger from './pages/PartnerLedger';
import BusinessAccount from './pages/BusinessAccount';
import Expense from './pages/Expense';
import SalesOrder from './pages/SalesOrder';
import UsersAndRoles from './pages/UsersAndRoles';
import AuditLog from './pages/AuditLog';
import ProfitLossReport from './pages/ProfitLossReport';
import NotificationCenter from './components/NotificationCenter';
import logoImg from './assets/logo.png';

import {
  Home, Package, Layers, Maximize2, Scale, BarChart2,
  Users, UserCheck, ShoppingCart, ShoppingBag, BookOpen,
  DollarSign, Activity, Settings, Menu, X, ShieldCheck,
  TrendingUp, Leaf, Bell, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  User, UserPlus, Shield, Fingerprint, ClipboardList
} from 'lucide-react';
import { biometricService } from './services/biometricService';
import Swal from 'sweetalert2';

// Inline-style based themes for smooth CSS background-color transition
const NAVBAR_THEMES = [
  {
    name: 'violet',
    bgColor: '#1e0838',          // deep purple
    borderColor: '#7c3aed55',
    btnBgColor: 'rgba(109,40,217,0.25)',
    badgeColor: '#7c3aed',
    titleColor: '#f3e8ff',
    subtitleColor: '#c4b5fd',
    avatarFrom: '#7c3aed', avatarTo: '#4f46e5',
  },
  {
    name: 'skyblue',
    bgColor: '#082032',          // deep sky
    borderColor: '#0ea5e955',
    btnBgColor: 'rgba(14,165,233,0.2)',
    badgeColor: '#0ea5e9',
    titleColor: '#e0f2fe',
    subtitleColor: '#7dd3fc',
    avatarFrom: '#0ea5e9', avatarTo: '#06b6d4',
  },
  {
    name: 'blue',
    bgColor: '#09112f',          // deep navy
    borderColor: '#3b82f655',
    btnBgColor: 'rgba(59,130,246,0.2)',
    badgeColor: '#3b82f6',
    titleColor: '#dbeafe',
    subtitleColor: '#93c5fd',
    avatarFrom: '#3b82f6', avatarTo: '#6366f1',
  },
  {
    name: 'green',
    bgColor: '#031a10',          // deep emerald
    borderColor: '#10b98155',
    btnBgColor: 'rgba(16,185,129,0.2)',
    badgeColor: '#10b981',
    titleColor: '#d1fae5',
    subtitleColor: '#6ee7b7',
    avatarFrom: '#059669', avatarTo: '#0d9488',
  },
  {
    name: 'red',
    bgColor: '#1f0510',          // deep rose
    borderColor: '#f43f5e55',
    btnBgColor: 'rgba(244,63,94,0.2)',
    badgeColor: '#f43f5e',
    titleColor: '#ffe4e6',
    subtitleColor: '#fda4af',
    avatarFrom: '#e11d48', avatarTo: '#dc2626',
  }
];

function AppContent() {
  const { user, logout } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    const checkBiometricSettings = async () => {
      const avail = await biometricService.checkAvailability();
      if (avail.isAvailable && avail.hasCredentials && avail.configuredUsername === user?.username) {
        setBiometricEnabled(true);
      } else {
        setBiometricEnabled(false);
      }
    };
    if (user) {
      checkBiometricSettings();
    }
  }, [user]);

  const handleDisableBiometrics = async () => {
    const result = await Swal.fire({
      title: 'Disable Biometric Login?',
      text: 'You will need to use your username and password to log in next time.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, disable',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b'
    });

    if (result.isConfirmed) {
      await biometricService.deleteCredentials();
      setBiometricEnabled(false);
      Swal.fire('Disabled', 'Biometric login has been disabled.', 'success');
    }
  };
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('vpms_active_tab') || 'home';
  });

  // Dynamic Auto Color-Cycling Top Navbar State (Violet -> Sky Blue -> Blue -> Green -> Red)
  const [navbarThemeIdx, setNavbarThemeIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setNavbarThemeIdx(prev => (prev + 1) % NAVBAR_THEMES.length);
    }, 4000); // Change every 4s; CSS transition handles 1.5s slow blend
    return () => clearInterval(timer);
  }, []);

  const activeTheme = NAVBAR_THEMES[navbarThemeIdx];

  // Mobile nav overlay drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Collapsible desktop sidebar state (default open)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  // Sidebar sub-menu collapse state
  const [collapseStock, setCollapseStock] = useState(false);
  const [collapseFinance, setCollapseFinance] = useState(false);
  const [collapseContacts, setCollapseContacts] = useState(false);

  if (!user) {
    return <Login />;
  }

  const isAdmin = user.roles.includes('ADMIN');

  const displayName = (user.fullName && user.fullName.trim().length > 1 && !/^\d+$/.test(user.fullName)) ? user.fullName : user.username;
  const displayRole = user.roles && user.roles.length > 0 ? user.roles[0].toLowerCase() : 'user';
  const avatarLetter = displayName[0].toUpperCase();

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem('vpms_active_tab', tabId);
    setIsSidebarOpen(false);
  };

  const currentTabLabel = () => {
    const allItems = [
      { id: 'home', label: 'Dashboard Overview' },
      { id: 'orders', label: 'Sales Orders (Drafts)' },
      { id: 'sales', label: 'Sales Ledger' },
      { id: 'purchase', label: 'Purchase Intake' },
      { id: 'batch', label: 'Stock Batches' },
      { id: 'partner', label: 'Partner Management' },
      { id: 'profitloss', label: 'Business Reports' },
      { id: 'product', label: 'Products Master' },
      { id: 'category', label: 'Categories' },
      { id: 'variant', label: 'Variants' },
      { id: 'unit', label: 'Units' },
      { id: 'account', label: 'Business Accounts' },
      { id: 'expense', label: 'Expenses' },
      { id: 'customer', label: 'Customers' },
      { id: 'supplier', label: 'Suppliers' },
      { id: 'users', label: 'Settings & Staff' },
      { id: 'audit', label: 'Audit Logs' }
    ];
    const match = allItems.find(i => i.id === activeTab);
    return match ? match.label : 'Vinayaga Plates';
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col md:flex-row relative bg-brand-bg">
      {/* =========================================================
          DESKTOP COLLAPSIBLE SIDEBAR
      ========================================================= */}
      <aside className={`hidden md:flex flex-col bg-brand-sidebar text-slate-300 border-r border-brand-sidebar-hover sticky top-0 h-screen z-40 overflow-y-auto transition-all duration-300 shadow-xl ${desktopSidebarOpen ? 'w-64' : 'w-20'
        }`}>
        {/* Sidebar Header with Leaf logo trigger */}
        <div className="p-3.5 border-b border-brand-sidebar-hover flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <button
              onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
              className="p-1 bg-brand-accent/10 rounded-xl border border-brand-accent/20 hover:bg-brand-accent/20 transition shrink-0 outline-none overflow-hidden"
              title={desktopSidebarOpen ? "Collapse navigation" : "Expand navigation"}
            >
              <img src={logoImg} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
            </button>
            {desktopSidebarOpen && (
              <div className="transition-opacity duration-300 min-w-0">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-100 leading-none whitespace-nowrap">Vinayaga Plates</h1>
                <span className="text-[8px] text-brand-accent font-bold uppercase tracking-wider block mt-0.5 whitespace-nowrap">Management System</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <NotificationCenter onNavigate={handleTabSelect} isSidebar={true} />
            {desktopSidebarOpen && (
              <button onClick={() => setDesktopSidebarOpen(false)} className="text-slate-300 hover:text-slate-100 p-1">
                <ChevronLeft size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3 space-y-4 text-sm font-bold">
          {/* Main items */}
          <div className="space-y-1">
            <button
              onClick={() => handleTabSelect('home')}
              className={`w-full flex items-center rounded-xl transition ${desktopSidebarOpen ? 'gap-3 px-3 py-2 justify-start' : 'p-2.5 justify-center'
                } ${activeTab === 'home'
                  ? 'bg-brand-accent text-white border border-brand-accent/20 font-bold'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-brand-sidebar-hover'
                }`}
              title={!desktopSidebarOpen ? 'Dashboard' : ''}
            >
              <Home size={15} />
              {desktopSidebarOpen && <span>Dashboard</span>}
            </button>

            <button
              onClick={() => handleTabSelect('orders')}
              className={`w-full flex items-center rounded-xl transition ${desktopSidebarOpen ? 'gap-3 px-3 py-2 justify-start' : 'p-2.5 justify-center'
                } ${activeTab === 'orders'
                  ? 'bg-brand-accent text-white border border-brand-accent/20 font-bold'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-brand-sidebar-hover'
                }`}
              title={!desktopSidebarOpen ? 'Sales Orders' : ''}
            >
              <ClipboardList size={15} />
              {desktopSidebarOpen && <span>Sales Orders</span>}
            </button>

            <button
              onClick={() => handleTabSelect('sales')}
              className={`w-full flex items-center rounded-xl transition ${desktopSidebarOpen ? 'gap-3 px-3 py-2 justify-start' : 'p-2.5 justify-center'
                } ${activeTab === 'sales'
                  ? 'bg-brand-accent text-white border border-brand-accent/20 font-bold'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-brand-sidebar-hover'
                }`}
              title={!desktopSidebarOpen ? 'Sales Ledger' : ''}
            >
              <ShoppingCart size={15} />
              {desktopSidebarOpen && <span>Sales Ledger</span>}
            </button>

            <button
              onClick={() => handleTabSelect('purchase')}
              className={`w-full flex items-center rounded-xl transition ${desktopSidebarOpen ? 'gap-3 px-3 py-2 justify-start' : 'p-2.5 justify-center'
                } ${activeTab === 'purchase'
                  ? 'bg-brand-accent text-white border border-brand-accent/20 font-bold'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-brand-sidebar-hover'
                }`}
              title={!desktopSidebarOpen ? 'Purchase' : ''}
            >
              <ShoppingBag size={15} />
              {desktopSidebarOpen && <span>Purchase</span>}
            </button>

            <button
              onClick={() => handleTabSelect('batch')}
              className={`w-full flex items-center rounded-xl transition ${desktopSidebarOpen ? 'gap-3 px-3 py-2 justify-start' : 'p-2.5 justify-center'
                } ${activeTab === 'batch'
                  ? 'bg-brand-accent text-white border border-brand-accent/20 font-bold'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-brand-sidebar-hover'
                }`}
              title={!desktopSidebarOpen ? 'Inventory' : ''}
            >
              <Package size={15} />
              {desktopSidebarOpen && <span>Stock</span>}
            </button>

            <button
              onClick={() => handleTabSelect('partner')}
              className={`w-full flex items-center rounded-xl transition ${desktopSidebarOpen ? 'gap-3 px-3 py-2 justify-start' : 'p-2.5 justify-center'
                } ${activeTab === 'partner'
                  ? 'bg-brand-accent text-white border border-brand-accent/20 font-bold'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-brand-sidebar-hover'
                }`}
              title={!desktopSidebarOpen ? 'Partner Management' : ''}
            >
              <Users size={15} />
              {desktopSidebarOpen && <span>Partners</span>}
            </button>

            <button
              onClick={() => handleTabSelect('profitloss')}
              className={`w-full flex items-center rounded-xl transition ${desktopSidebarOpen ? 'gap-3 px-3 py-2 justify-start' : 'p-2.5 justify-center'
                } ${activeTab === 'profitloss'
                  ? 'bg-brand-accent text-white border border-brand-accent/20 font-bold'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-brand-sidebar-hover'
                }`}
              title={!desktopSidebarOpen ? 'Business Reports' : ''}
            >
              <TrendingUp size={15} />
              {desktopSidebarOpen && <span>Reports</span>}
            </button>
          </div>

          {/* Products & Stock Section */}
          {desktopSidebarOpen ? (
            <div className="space-y-1">
              <button
                onClick={() => setCollapseStock(!collapseStock)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-extrabold text-slate-400 uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis hover:text-slate-100"
              >
                <span>Products & Stock</span>
                {collapseStock ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </button>

              {!collapseStock && (
                <div className="pl-3 space-y-1 border-l border-brand-sidebar-hover/50 ml-3.5">
                  <button onClick={() => handleTabSelect('product')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'product' ? 'text-brand-accent font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Products Master</button>
                  <button onClick={() => handleTabSelect('category')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'category' ? 'text-brand-accent font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Categories</button>
                  <button onClick={() => handleTabSelect('variant')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'variant' ? 'text-brand-accent font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Variants (Sizing)</button>
                  <button onClick={() => handleTabSelect('unit')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'unit' ? 'text-brand-accent font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Units</button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-px bg-brand-sidebar-hover my-1"></div>
          )}

          {/* Accounting & Finance Section */}
          {desktopSidebarOpen ? (
            <div className="space-y-1">
              <button
                onClick={() => setCollapseFinance(!collapseFinance)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-extrabold text-slate-400 uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis hover:text-slate-100"
              >
                <span>Accounting & Finance</span>
                {collapseFinance ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </button>

              {!collapseFinance && (
                <div className="pl-3 space-y-1 border-l border-brand-sidebar-hover/50 ml-3.5">
                  <button onClick={() => handleTabSelect('account')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'account' ? 'text-brand-accent font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Accounts</button>
                  <button onClick={() => handleTabSelect('partnerledger')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'partnerledger' ? 'text-brand-accent font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Partner Ledger</button>
                  <button onClick={() => handleTabSelect('expense')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'expense' ? 'text-brand-accent font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Expenses</button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-px bg-brand-sidebar-hover my-1"></div>
          )}

          {/* Other settings */}
          <div className="space-y-1 pt-2 border-t border-brand-sidebar-hover/50">
            {desktopSidebarOpen ? (
              <div className="space-y-1">
                <button
                  onClick={() => setCollapseContacts(!collapseContacts)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-extrabold text-slate-400 uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis hover:text-slate-100"
                >
                  <span>Customers & Suppliers</span>
                  {collapseContacts ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>

                {!collapseContacts && (
                  <div className="pl-3 space-y-1 border-l border-brand-sidebar-hover/50 ml-3.5">
                    <button onClick={() => handleTabSelect('customer')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'customer' ? 'text-brand-accent font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Customers</button>
                    <button onClick={() => handleTabSelect('supplier')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'supplier' ? 'text-brand-accent font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Suppliers</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <button
                  onClick={() => handleTabSelect('customer')}
                  className={`w-full flex items-center justify-center p-2.5 rounded-xl transition ${activeTab === 'customer' ? 'bg-brand-accent text-white border border-brand-accent/20 font-bold' : 'text-slate-300 hover:text-slate-100'}`}
                  title="Customers"
                >
                  <UserCheck size={14} />
                </button>
                <button
                  onClick={() => handleTabSelect('supplier')}
                  className={`w-full flex items-center justify-center p-2.5 rounded-xl transition ${activeTab === 'supplier' ? 'bg-brand-accent text-white border border-brand-accent/20 font-bold' : 'text-slate-300 hover:text-slate-100'}`}
                  title="Suppliers"
                >
                  <Users size={14} />
                </button>
              </div>
            )}

            <button
              onClick={() => handleTabSelect('users')}
              className={`w-full flex items-center rounded-xl transition ${desktopSidebarOpen ? 'gap-3 px-3 py-2 justify-start' : 'p-2.5 justify-center'
                } ${activeTab === 'users' ? 'text-brand-accent font-bold' : 'text-slate-300 hover:text-slate-100'
                }`}
              title={!desktopSidebarOpen ? 'Settings & Staff' : ''}
            >
              <Settings size={14} />
              {desktopSidebarOpen && <span>Settings</span>}
            </button>

            {isAdmin && (
              <button
                onClick={() => handleTabSelect('audit')}
                className={`w-full flex items-center rounded-xl transition ${desktopSidebarOpen ? 'gap-3 px-3 py-2 justify-start' : 'p-2.5 justify-center'
                  } ${activeTab === 'audit' ? 'text-brand-accent font-bold' : 'text-slate-300 hover:text-slate-100'
                  }`}
                title={!desktopSidebarOpen ? 'Audit Logs' : ''}
              >
                <ShieldCheck size={14} />
                {desktopSidebarOpen && <span>Audit Logs</span>}
              </button>
            )}
          </div>
        </nav>

        {/* Desktop Sidebar Footer: swapped profile card and sign out button as requested */}
        <div className="p-3 border-t border-brand-sidebar-hover/50 space-y-2">
          {biometricEnabled && (
            <button
              onClick={handleDisableBiometrics}
              className={`w-full bg-brand-sidebar-hover hover:bg-[#3f0f13]/30 hover:text-rose-400 border border-brand-sidebar-hover/50 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center ${desktopSidebarOpen ? 'px-3 gap-2' : 'p-2'}`}
              title="Disable Biometric"
            >
              <Fingerprint size={14} />
              {desktopSidebarOpen && <span>Disable Biometric</span>}
            </button>
          )}
          <button
            onClick={logout}
            className={`w-full bg-brand-sidebar-hover hover:bg-[#3f0f13]/30 hover:text-rose-455 border border-brand-sidebar-hover/50 text-brand-accent py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center ${desktopSidebarOpen ? 'px-3 gap-2' : 'p-2'
              }`}
            title="Sign Out"
          >
            <X size={14} />
            {desktopSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================
          DYNAMIC SMOOTH COLOR-CYCLING MOBILE TOP NAVBAR
          Background & text smoothly blend over 1.5s via inline style CSS transitions
      ========================================================= */}
      <header
        className="md:hidden sticky top-0 text-white shadow-lg backdrop-blur-xl border-b px-4 py-2.5 flex justify-between items-center z-50"
        style={{
          backgroundColor: activeTheme.bgColor,
          borderColor: activeTheme.borderColor,
          transition: 'background-color 1.5s ease-in-out, border-color 1.5s ease-in-out'
        }}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl border border-white/10 shadow-inner active:scale-95 transition-all"
            style={{ backgroundColor: activeTheme.btnBgColor, transition: 'background-color 1.5s ease-in-out' }}
            aria-label="Open Navigation Menu"
          >
            <Menu size={19} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            {/* Logo Image */}
            <div
              className="h-8 w-8 rounded-xl border border-white/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner p-0.5"
              style={{ backgroundColor: activeTheme.btnBgColor, transition: 'background-color 1.5s ease-in-out' }}
            >
              <img src={logoImg} alt="Vinayaga Plates" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div>
              <h1
                className="text-xs font-black leading-tight tracking-wide"
                style={{ color: activeTheme.titleColor, transition: 'color 1.5s ease-in-out' }}
              >
                Vinayaga Plates
              </h1>
              <span
                className="text-[8px] font-extrabold uppercase tracking-widest block mt-0.5"
                style={{ color: activeTheme.subtitleColor, transition: 'color 1.5s ease-in-out' }}
              >
                Management System
              </span>
            </div>
          </div>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-2">
          <NotificationCenter onNavigate={handleTabSelect} isMobile={true} />

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 p-1 pr-2 rounded-xl border border-white/10 shadow-inner active:scale-95 transition-transform"
              style={{ backgroundColor: activeTheme.btnBgColor, transition: 'background-color 1.5s ease-in-out' }}
            >
              <div
                className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-black shadow-md border-2 border-white/20"
                style={{
                  backgroundColor: activeTheme.badgeColor,
                  transition: 'background-color 1.5s ease-in-out'
                }}
              >
                {avatarLetter}
              </div>
              <ChevronDown size={13} className="text-slate-300" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 backdrop-blur-md rounded-2xl py-1 text-xs z-50 shadow-2xl shadow-black/70 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/60">
                  <p className="font-black text-white leading-tight truncate">{displayName}</p>
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
                    style={{ color: activeTheme.subtitleColor, transition: 'color 1.5s ease-in-out' }}
                  >{displayRole}</p>
                </div>
                {biometricEnabled && (
                  <button onClick={handleDisableBiometrics} className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/40 text-indigo-400 font-bold transition flex items-center gap-2 border-b border-slate-800">
                    <Fingerprint size={14} />
                    <span>Disable Biometrics</span>
                  </button>
                )}
                <button onClick={logout} className="w-full text-left px-3.5 py-2.5 hover:bg-rose-950/40 text-rose-400 font-bold transition flex items-center gap-2">
                  <X size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Nav Overlay) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-955/85 backdrop-blur-sm z-40 md:hidden flex justify-start">
          <div className="w-4/5 max-w-xs bg-brand-sidebar border-r border-brand-sidebar-hover/50 h-full flex flex-col p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-brand-sidebar-hover/50">
              <span className="font-black text-slate-100 text-sm">Navigation</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-brand-accent"><X size={18} /></button>
            </div>

            <nav className="flex-1 space-y-4 text-sm font-bold">
              {/* Main items */}
              <div className="space-y-1">
                <button onClick={() => handleTabSelect('home')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition ${activeTab === 'home' ? 'bg-brand-accent text-white border border-brand-accent/20' : 'text-slate-300'}`}><Home size={15} /><span>Dashboard</span></button>
                <button onClick={() => handleTabSelect('orders')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition ${activeTab === 'orders' ? 'bg-brand-accent text-white border border-brand-accent/20' : 'text-slate-300'}`}><ClipboardList size={15} /><span>Sales Orders</span></button>
                <button onClick={() => handleTabSelect('sales')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition ${activeTab === 'sales' ? 'bg-brand-accent text-white border border-brand-accent/20' : 'text-slate-300'}`}><ShoppingCart size={15} /><span>Sales Ledger</span></button>
                <button onClick={() => handleTabSelect('purchase')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition ${activeTab === 'purchase' ? 'bg-brand-accent text-white border border-brand-accent/20' : 'text-slate-300'}`}><ShoppingBag size={15} /><span>Purchase</span></button>
                <button onClick={() => handleTabSelect('batch')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition ${activeTab === 'batch' ? 'bg-brand-accent text-white border border-brand-accent/20' : 'text-slate-300'}`}><Package size={15} /><span>Inventory</span></button>
                <button onClick={() => handleTabSelect('partner')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition ${activeTab === 'partner' ? 'bg-brand-accent text-white border border-brand-accent/20' : 'text-slate-300'}`}><Users size={15} /><span>Partner Management</span></button>
                <button onClick={() => handleTabSelect('profitloss')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition ${activeTab === 'profitloss' ? 'bg-brand-accent text-white border border-brand-accent/20' : 'text-slate-300'}`}><TrendingUp size={15} /><span>Business Reports</span></button>
              </div>

              {/* Products & Stock Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setCollapseStock(!collapseStock)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-extrabold text-slate-400 uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <span>Products & Stock</span>
                  {collapseStock ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>

                {!collapseStock && (
                  <div className="pl-3 space-y-1 border-l border-brand-sidebar-hover/50 ml-3.5">
                    <button onClick={() => handleTabSelect('product')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'product' ? 'text-brand-accent font-bold' : 'text-slate-300'}`}>Products Master</button>
                    <button onClick={() => handleTabSelect('category')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'category' ? 'text-brand-accent font-bold' : 'text-slate-300'}`}>Categories</button>
                    <button onClick={() => handleTabSelect('variant')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'variant' ? 'text-brand-accent font-bold' : 'text-slate-300'}`}>Variants (Sizing)</button>
                    <button onClick={() => handleTabSelect('unit')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'unit' ? 'text-brand-accent font-bold' : 'text-slate-300'}`}>Units</button>
                  </div>
                )}
              </div>

              {/* Accounting & Finance Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setCollapseFinance(!collapseFinance)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-extrabold text-slate-400 uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <span>Accounting & Finance</span>
                  {collapseFinance ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>

                {!collapseFinance && (
                  <div className="pl-3 space-y-1 border-l border-brand-sidebar-hover/50 ml-3.5">
                    <button onClick={() => handleTabSelect('account')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'account' ? 'text-brand-accent font-bold' : 'text-slate-300'}`}>Accounts</button>
                    <button onClick={() => handleTabSelect('partnerledger')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'partnerledger' ? 'text-brand-accent font-bold' : 'text-slate-300'}`}>Partner Ledger</button>
                    <button onClick={() => handleTabSelect('expense')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'expense' ? 'text-brand-accent font-bold' : 'text-slate-300'}`}>Expenses</button>
                  </div>
                )}
              </div>

              {/* Bottom links */}
              <div className="space-y-1 pt-2 border-t border-brand-sidebar-hover/50">
                <div className="space-y-1">
                  <button
                    onClick={() => setCollapseContacts(!collapseContacts)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-extrabold text-slate-400 uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <span>Customers & Suppliers</span>
                    {collapseContacts ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                  </button>

                  {!collapseContacts && (
                    <div className="pl-3 space-y-1 border-l border-brand-sidebar-hover/50 ml-3.5">
                      <button onClick={() => handleTabSelect('customer')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'customer' ? 'text-brand-accent font-bold' : 'text-slate-300'}`}>Customers</button>
                      <button onClick={() => handleTabSelect('supplier')} className={`w-full text-left px-3 py-1.5 rounded-lg transition ${activeTab === 'supplier' ? 'text-brand-accent font-bold' : 'text-slate-300'}`}>Suppliers</button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleTabSelect('users')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition ${activeTab === 'users' ? 'text-brand-accent font-bold' : 'text-slate-300'
                    }`}
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleTabSelect('audit')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition ${activeTab === 'audit' ? 'text-brand-accent font-bold' : 'text-slate-300'
                      }`}
                  >
                    <ShieldCheck size={14} />
                    <span>Audit Logs</span>
                  </button>
                )}
              </div>
            </nav>

            <div className="pt-3 border-t border-brand-sidebar-hover/50 mt-5 space-y-2">
              {biometricEnabled && (
                <button onClick={handleDisableBiometrics} className="w-full bg-slate-900/60 hover:bg-slate-900 text-indigo-400 border border-slate-800/20 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">
                  <Fingerprint size={14} />
                  <span>Disable Biometrics</span>
                </button>
              )}
              <button onClick={logout} className="w-full bg-[#3f0f13]/30 hover:bg-[#3f0f13]/50 text-rose-400 border border-rose-950/20 py-2 rounded-xl text-xs font-bold transition">
                Sign Out
              </button>
              <div className="bg-[#0b1c11]/80 p-2.5 rounded-xl border border-brand-sidebar-hover/50 text-center">
                <span className="text-xs font-bold text-slate-100 block">{displayName}</span>
                <span className="text-[10px] text-brand-accent block font-mono">{displayRole}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto p-4 md:p-8 transition-all duration-300 w-full overflow-x-hidden pb-24 md:pb-8">
        {activeTab === 'home' && <Dashboard onTabSelect={handleTabSelect} />}
        {activeTab === 'profitloss' && <ProfitLossReport onNavigate={handleTabSelect} />}
        {activeTab === 'product' && <Product />}
        {activeTab === 'category' && <Category />}
        {activeTab === 'variant' && <Variant />}
        {activeTab === 'unit' && <Unit />}
        {activeTab === 'batch' && <Batch />}
        {activeTab === 'customer' && <Customer />}
        {activeTab === 'supplier' && <Supplier />}
        {activeTab === 'orders' && <SalesOrder onNavigateToSale={() => handleTabSelect('sales')} />}
        {activeTab === 'sales' && <Sales />}
        {activeTab === 'purchase' && <Purchase />}
        {activeTab === 'partner' && <Partner />}
        {activeTab === 'partnerledger' && <PartnerLedger />}
        {activeTab === 'account' && <BusinessAccount />}
        {activeTab === 'expense' && <Expense />}
        {activeTab === 'users' && <UsersAndRoles />}
        {activeTab === 'audit' && <AuditLog />}
      </main>

      {/* Mobile Bottom Navigation Bar - High-Contrast Floating Glass Design */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 py-1.5 px-2 flex justify-around items-center z-45">
        <button
          onClick={() => handleTabSelect('home')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'home'
              ? 'text-blue-600 font-black bg-blue-50/90 border border-blue-200/60 shadow-xs scale-105'
              : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-50'
          }`}
        >
          <Home size={19} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        <button
          onClick={() => handleTabSelect('batch')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'batch'
              ? 'text-blue-600 font-black bg-blue-50/90 border border-blue-200/60 shadow-xs scale-105'
              : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-50'
          }`}
        >
          <Package size={19} strokeWidth={activeTab === 'batch' ? 2.5 : 2} />
          <span className="text-[10px] tracking-tight">Inventory</span>
        </button>

        <button
          onClick={() => handleTabSelect('profitloss')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'profitloss'
              ? 'text-blue-600 font-black bg-blue-50/90 border border-blue-200/60 shadow-xs scale-105'
              : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-50'
          }`}
        >
          <TrendingUp size={19} strokeWidth={activeTab === 'profitloss' ? 2.5 : 2} />
          <span className="text-[10px] tracking-tight">Reports</span>
        </button>

        <button
          onClick={() => handleTabSelect('users')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'users'
              ? 'text-blue-600 font-black bg-blue-50/90 border border-blue-200/60 shadow-xs scale-105'
              : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-50'
          }`}
        >
          <Settings size={19} strokeWidth={activeTab === 'users' ? 2.5 : 2} />
          <span className="text-[10px] tracking-tight">Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
