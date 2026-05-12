import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// import { Button } from '../ui';
import { LayoutDashboard, ShoppingCart, LogOut, Menu, Flag } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    { title: 'Orders', icon: ShoppingCart, path: '/dashboard/orders' },
    { title: 'Flags', icon: Flag, path: '/dashboard/flags' },
    // Add more menu items here
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r transition-all duration-300 flex flex-col z-20 shadow-sm",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between border-b bg-primary">
          {isSidebarOpen ? (
            <span className="text-xl font-bold tracking-tight text-white">Admin Panel</span>
          ) : (
            <LayoutDashboard className="h-6 w-6 text-white" />
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center p-3 rounded-lg transition-all group",
                location.pathname.startsWith(item.path)
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isSidebarOpen ? "mr-3" : "mx-auto"
              )} />
              {isSidebarOpen && <span>{item.title}</span>}
              {!isSidebarOpen && (
                <div className="absolute left-20 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.title}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center w-full p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all group",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className={cn("h-5 w-5", isSidebarOpen && "mr-3")} />
            {isSidebarOpen && <span>Logout</span>}
            {!isSidebarOpen && (
              <div className="absolute left-20 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <h1 className="text-lg font-semibold text-gray-800 capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* <Button variant="ghost" size="icon" className="relative transition-transform hover:scale-105">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
            </Button> */}
            <div className="flex items-center space-x-3 bg-gray-50 py-1.5 px-3 rounded-full border hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-inner group-hover:scale-105 transition-transform">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-gray-800 leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 capitalize leading-tight">{user?.role || 'User'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
