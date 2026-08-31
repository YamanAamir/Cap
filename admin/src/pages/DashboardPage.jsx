import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/admin.service';
import { Loader2, Package, CalendarCheck, ShoppingCart, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0) + ' kr.';

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12">
      
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Main Content Area */}
        <div className="flex-1 space-y-8">
          
          {/* Sales Reports Section */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Dashboard Overview</h2>
            
            <div className="bg-[#f0f4f8] rounded-xl p-6 border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Total Orders Card */}
                <div className="bg-[#eef2f6] rounded-xl p-5 flex items-center border border-blue-100">
                  <div className="w-12 h-12 rounded-full bg-[#4a90e2] flex items-center justify-center text-white shrink-0 mr-4 shadow-sm">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#1e3a8a] mb-1 uppercase tracking-wide">Total Orders</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-2xl font-black text-[#1e3a8a] leading-none">{stats?.totalOrders || 0}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#4a90e2]">{stats?.readyForProduction || 0}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Ready for Prod</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Card */}
                <div className="bg-[#fdf8f4] rounded-xl p-5 flex items-center border border-orange-100">
                  <div className="w-12 h-12 rounded-full bg-[#f59e0b] flex items-center justify-center text-white shrink-0 mr-4 shadow-sm">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#78350f] mb-1 uppercase tracking-wide">Total Revenue</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xl font-black text-[#78350f] leading-none">{formatCurrency(stats?.totalRevenue)}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Lifetime</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marketing Card */}
                <div className="bg-[#f1f8f5] rounded-xl p-5 flex items-center border border-green-100 lg:col-span-1 md:col-span-2">
                  <div className="w-12 h-12 rounded-full bg-[#5cb85c] flex items-center justify-center text-white shrink-0 mr-4 shadow-sm">
                    <CalendarCheck className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#2d6a4f] mb-1 uppercase tracking-wide">Marketing</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-2xl font-black text-[#2d6a4f] leading-none">{stats?.smsConsentCount || 0}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">SMS Consents</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#5cb85c]">{stats?.usedDiscountCodes || 0}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Discounts Used</p>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </section>

          {/* Recent Orders Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Recent Orders</h2>
              <Link to="/dashboard/orders" className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded shadow-sm transition-colors">
                View All Orders
              </Link>
            </div>

            <div className="bg-white rounded border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#fafafa] border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-700">Order #</th>
                    <th className="px-6 py-4 font-bold text-slate-700">Customer</th>
                    <th className="px-6 py-4 font-bold text-slate-700">Date</th>
                    <th className="px-6 py-4 font-bold text-slate-700">Amount</th>
                    <th className="px-6 py-4 font-bold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.recentOrders?.length === 0 ? (
                     <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-medium">No recent orders found</td>
                     </tr>
                  ) : (
                    stats?.recentOrders?.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-blue-600 font-bold">{order.orderNumber}</td>
                        <td className="px-6 py-4 text-slate-700 font-medium">{order.customerName}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-bold">{formatCurrency(order.price)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: order.statusColor }}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
        
        {/* Right Sidebar - Portal Status */}
        <aside className="xl:w-[320px] shrink-0">
          <div className="flex items-center justify-between mb-4">
             <div className="flex bg-blue-50 rounded overflow-hidden shadow-sm border border-blue-100">
               <button className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold tracking-wider">DKK</button>
             </div>
             <div className="flex items-center text-xs font-medium text-slate-600 border border-slate-200 rounded px-2 py-1.5 bg-white shadow-sm">
               Today: {new Date().toLocaleDateString('da-DK')}
             </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold text-slate-800">Order Pipeline</h2>
             <Link to="/dashboard/statuses" className="bg-[#95b8a2] hover:bg-[#7a9d87] text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded shadow-sm transition-colors">
               Manage
             </Link>
          </div>

          <div className="space-y-3">
            {stats?.statusCounts?.map((status) => (
              <div key={status.id} className="p-4 rounded-xl flex items-center border shadow-sm bg-white hover:border-slate-300 transition-colors">
                <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 mr-4 shadow-sm border border-slate-100" style={{ backgroundColor: status.color + '15' }}>
                  <Activity className="h-4 w-4" style={{ color: status.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">{status.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-slate-800 leading-none">{status.count}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {status.percentage}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full rounded-full" style={{ width: `${status.percentage}%`, backgroundColor: status.color }} />
                  </div>
                </div>
              </div>
            ))}
            
            {stats?.statusCounts?.length === 0 && (
              <div className="p-6 text-center text-sm font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-xl">
                No statuses configured.
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
};

export default DashboardPage;
