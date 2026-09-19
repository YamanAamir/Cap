import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ShoppingCart, LogOut, Menu, Flag, Users, Factory,
  ListOrdered, Tag, MessageSquare, FileSpreadsheet, Mail, Settings, CreditCard,
  Image as ImageIcon, ShoppingBag, Globe
} from 'lucide-react';

import { cn } from '@/lib/utils';
import logo from '../../assets/logo.png';

const getNavItems = (role, mode) => {
  if (mode === 'web') {
    return [
      { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/webshop' },
      { title: 'Products', icon: ShoppingBag, path: '/dashboard/webshop/products' },
      { title: 'Orders', icon: ShoppingCart, path: '/dashboard/webshop/orders' },
      { title: 'Customers', icon: Users, path: '/dashboard/webshop/customers' },
      { title: 'Order Statuses', icon: ListOrdered, path: '/dashboard/webshop/statuses' },
      { title: 'Email Templates', icon: Mail, path: '/dashboard/webshop/emails' },
    ];
  }

  if (role === 'production') {
    return [
      { title: 'Production Tasks', icon: Factory, path: '/dashboard/factory' },
      { title: 'Factory Media', icon: ImageIcon, path: '/dashboard/factory/media' }
    ];
  }
  return [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'Orders', icon: ShoppingCart, path: '/dashboard/orders' },
    { title: 'Media Gallery', icon: ImageIcon, path: '/dashboard/media' },
    { title: 'Customers', icon: Users, path: '/dashboard/customers' },
    { title: 'Production Export', icon: Factory, path: '/dashboard/production' },
    { title: 'Order Statuses', icon: ListOrdered, path: '/dashboard/statuses' },
    { title: 'Excel Template', icon: FileSpreadsheet, path: '/dashboard/excel-templates' },
    { title: 'Email Templates', icon: Mail, path: '/dashboard/emails' },
    { title: 'SMS Campaigns', icon: MessageSquare, path: '/dashboard/sms' },
    { title: 'Discount Codes', icon: Tag, path: '/dashboard/discounts' },
    { title: 'Installment Plans', icon: CreditCard, path: '/dashboard/installments' },
    { title: 'Configurator', icon: Settings, path: '/dashboard/settings/configurator' },

    { title: 'Production Settings', icon: Factory, path: '/dashboard/settings/production' },
    { title: 'Users & Roles', icon: Users, path: '/dashboard/users' },
  ];
};

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/dashboard/orders': 'Orders',
  '/dashboard/media': 'Media Gallery',
  '/dashboard/customers': 'Customers',
  '/dashboard/production': 'Production',
  '/dashboard/statuses': 'Order Statuses',
  '/dashboard/excel-templates': 'Excel Template',
  '/dashboard/emails': 'Email Templates',
  '/dashboard/sms': 'SMS Campaigns',
  '/dashboard/discounts': 'Discount Codes',
  '/dashboard/installments': 'Installment Plans',
  '/dashboard/settings/configurator': 'Configurator Settings',

  '/dashboard/settings/production': 'Production Display Settings',
  '/dashboard/users': 'Users & Roles',
  '/dashboard/factory': 'Factory Tasks',
  '/dashboard/factory/media': 'Factory Media Gallery',

  '/dashboard/webshop': 'Webshop Dashboard',
  '/dashboard/webshop/products': 'Webshop Products',
  '/dashboard/webshop/orders': 'Webshop Orders',
  '/dashboard/webshop/customers': 'Webshop Customers',
  '/dashboard/webshop/statuses': 'Webshop Order Statuses',
  '/dashboard/webshop/emails': 'Webshop Email Templates',
};

const pageSubtitles = {
  '/dashboard': 'Everything here',
  '/dashboard/orders': 'Cap Orders Listing',
  '/dashboard/media': 'Order Artwork & 3D Visual Assets',
  '/dashboard/customers': 'StudentLife Users Listing',
  '/dashboard/production': 'Production Exports',
  '/dashboard/statuses': 'Order Statuses Listing',
  '/dashboard/excel-templates': 'Excel Configuration',
  '/dashboard/emails': 'Email Templates Listing',
  '/dashboard/sms': 'SMS Marketing Listing',
  '/dashboard/discounts': 'StudentLife Coupon Listing',
  '/dashboard/installments': 'Manage Installment Plans',
  '/dashboard/settings/configurator': 'Manage prices and availability',

  '/dashboard/users': 'Manage Admin Permissions',
  '/dashboard/factory': 'Manage Production Queue',
  '/dashboard/factory/media': 'Artwork & images for production queue orders',

  '/dashboard/webshop': 'Webshop sales, revenue & product metrics',
  '/dashboard/webshop/products': 'Manage catalog, prices, descriptions & stock',
  '/dashboard/webshop/orders': 'Confirmed webshop orders & Stripe payments',
  '/dashboard/webshop/customers': 'Registered customers from webshop sales',
  '/dashboard/webshop/statuses': 'Manage custom order statuses and email attachments',
  '/dashboard/webshop/emails': 'Configure email templates and message content',
};

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Mode switcher: 'cap' (default) or 'web'
  const [dashboardMode, setDashboardMode] = useState(() => {
    if (location.pathname.startsWith('/dashboard/webshop')) return 'web';
    return 'cap';
  });

  useEffect(() => {
    if (user?.role === 'production' && !location.pathname.startsWith('/dashboard/factory')) {
      navigate('/dashboard/factory', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname.startsWith('/dashboard/webshop')) {
      setDashboardMode('web');
    } else {
      setDashboardMode('cap');
    }
  }, [location.pathname]);

  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingTarget, setSwitchingTarget] = useState('');

  const handleSwitchMode = (newMode) => {
    if (newMode === dashboardMode && !isSwitching) return;

    setIsSwitching(true);
    setSwitchingTarget(newMode);
    setDashboardMode(newMode);
    localStorage.setItem('cap_dashboard_mode', newMode);

    if (newMode === 'web') {
      navigate('/dashboard/webshop');
    } else {
      navigate('/dashboard');
    }

    // Smooth real-time load transition while target dashboard page & data mount
    setTimeout(() => {
      setIsSwitching(false);
    }, 850);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true);
        setIsSidebarOpen(false);
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('cap_dashboard_mode');
      setDashboardMode('cap');
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => {
    if (path === '/dashboard' || path === '/dashboard/webshop' || path === '/dashboard/factory') {
      return location.pathname === path || (path === '/dashboard/factory' && location.pathname.startsWith('/dashboard/factory/orders/'));
    }
    return location.pathname.startsWith(path);
  };

  const currentTitle =
    pageTitles[location.pathname] ||
    (location.pathname.includes('/orders/') ? 'Order Details' : 'Dashboard');
  
  const currentSubtitle =
    pageSubtitles[location.pathname] || '';

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden font-sans">
      
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'absolute lg:relative flex flex-col transition-transform duration-300 ease-in-out z-30 bg-white shadow-[2px_0_10px_rgba(0,0,0,0.05)] border-r border-slate-100 h-full',
          isSidebarOpen ? 'w-[260px] translate-x-0' : 'w-[260px] lg:w-[70px] -translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 border-b border-slate-100 flex items-center h-[72px] justify-between lg:justify-start">
          {(!isMobile && !isSidebarOpen) ? (
            <div className="w-full flex justify-center">
              <button onClick={() => setIsSidebarOpen(true)} className="text-slate-400 hover:text-slate-600">
                <Menu className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full px-1">
              <div className="h-10 w-36 flex items-center justify-start shrink-0">
                <img src={logo} alt="StudentLife" className="w-full h-full object-contain object-left scale-[1.8] origin-left pointer-events-none" />
              </div>
              {!isMobile && (
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="ml-auto text-slate-400 hover:text-slate-600 shrink-0 relative z-10 p-2 -mr-2"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
              )}
              {isMobile && (
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="ml-auto text-slate-400 hover:text-slate-600 shrink-0 relative z-10 p-2 -mr-2"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dashboard View Indicator Banner in Sidebar */}
        {(isSidebarOpen || isMobile) && user?.role !== 'production' && (
          <div className="mx-4 mt-3 px-3 py-2 bg-slate-100 rounded-lg flex items-center gap-2 text-xs font-bold text-slate-700 border border-slate-200">
            {dashboardMode === 'web' ? (
              <>
                <Globe className="w-4 h-4 text-[#1e3a8a]" />
                <span>Web Dashboard View</span>
              </>
            ) : (
              <>
                <LayoutDashboard className="w-4 h-4 text-[#1e3a8a]" />
                <span>Cap Dashboard View</span>
              </>
            )}
          </div>
        )}

        <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar space-y-1">
          {getNavItems(user?.role, dashboardMode).map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center relative transition-colors duration-200 group',
                  (isSidebarOpen || isMobile) ? 'px-6 py-3' : 'justify-center py-3'
                )}
              >
                <div className={cn("flex items-center w-full relative z-10", !(isSidebarOpen || isMobile) && "justify-center")}>
                  <item.icon className={cn(
                    'h-[18px] w-[18px] shrink-0 transition-colors', 
                    active ? 'text-[#1e3a8a]' : 'text-slate-500 group-hover:text-slate-900'
                  )} />
                  {(isSidebarOpen || isMobile) ? (
                    <span className={cn(
                      "text-sm font-medium flex-1 ml-4 transition-colors", 
                      active ? "text-[#1e3a8a] font-bold" : "text-slate-700 group-hover:text-slate-900"
                    )}>
                      {item.title}
                    </span>
                  ) : (
                    <div className="absolute left-12 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 font-medium shadow-lg">
                      {item.title}
                    </div>
                  )}
                </div>
                {/* Active Indicator Line */}
                {active && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#1e3a8a] z-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Header */}
        <header className="h-[72px] bg-white flex items-center justify-between px-4 md:px-8 shadow-sm z-10">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight truncate max-w-[200px] md:max-w-none">{currentTitle}</h1>
              {currentSubtitle && !isMobile && (
                <p className="text-[11px] text-slate-500 uppercase tracking-wide font-medium mt-1">{currentSubtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Dashboard Mode Switcher */}
            {user?.role !== 'production' && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('cap')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                    dashboardMode === 'cap' ? "bg-white text-[#1e3a8a] shadow-sm" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Cap Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('web')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                    dashboardMode === 'web' ? "bg-[#1e3a8a] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Web Dashboard
                </button>
              </div>
            )}

            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] text-slate-500 leading-none mb-1">Hello,</span>
              <span className="text-sm font-bold text-slate-900 leading-none">{user?.name || 'Admin User'}</span>
            </div>
            <div className="hidden lg:block w-px h-8 bg-slate-200"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <span className="hidden md:inline">LOGOUT</span> <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 relative bg-white">
          <Outlet />
        </main>
      </div>

      {/* Real-time Dashboard Switcher Loading Overlay */}
      {isSwitching && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 max-w-sm w-full text-center space-y-4 transform transition-all scale-100">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-[#1e3a8a] animate-spin" />
              <Globe className="w-7 h-7 text-[#1e3a8a] animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Switching to {switchingTarget === 'web' ? 'Web Dashboard' : 'Cap Dashboard'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Loading real-time workspace & page data...
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#1e3a8a] h-full animate-pulse w-full rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChevronLeftIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const XIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default DashboardLayout;
