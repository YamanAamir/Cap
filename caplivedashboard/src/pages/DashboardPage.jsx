import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/admin.service';
import { Loader2, Package, CalendarCheck, ShoppingCart, Activity, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'today' | 'month' | 'custom'
  const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' });

  const fetchStats = (filter = activeFilter, dates = customDates) => {
    setLoading(true);
    const params = { filter };
    if (filter === 'custom') {
      if (dates.startDate) params.startDate = dates.startDate;
      if (dates.endDate) params.endDate = dates.endDate;
    }
    getDashboardStats(params)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats(activeFilter, customDates);
  }, [activeFilter, customDates.startDate, customDates.endDate]);

  if (loading && !stats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0) + ' kr.';

  return (
    // FIX: min-w-0 stops this container from ever forcing the page wider than the
    // viewport (the classic cause of the right side getting cut off / needing a
    // horizontal scroll on laptop widths).
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12 min-w-0">

      <div className="flex flex-col lg:flex-row gap-6 min-w-0">

        {/* Main Content Area */}
        {/* FIX: min-w-0 here is the key fix for the "right side hidden" bug.
            Without it, a flex child's min-width defaults to its content's
            intrinsic width. The Recent Orders table uses whitespace-nowrap,
            so the browser was stretching this whole column (and pushing the
            sidebar off-screen to the right) to fit the table uncompressed. */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* Sales Reports Section */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-slate-800">Dashboard Overview</h2>

              {/* Date Filter Controls */}
              <div className="flex items-center gap-2 flex-wrap max-w-full">
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm text-xs overflow-x-auto custom-scrollbar max-w-full">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all whitespace-nowrap ${
                      activeFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('today')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all whitespace-nowrap ${
                      activeFilter === 'today'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('month')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all whitespace-nowrap ${
                      activeFilter === 'month'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('custom')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all whitespace-nowrap ${
                      activeFilter === 'custom'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Custom Date
                  </button>
                </div>

                {activeFilter === 'custom' && (
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-sm text-xs animate-in fade-in duration-300 flex-wrap">
                    <input
                      type="date"
                      value={customDates.startDate}
                      onChange={(e) => setCustomDates(prev => ({ ...prev, startDate: e.target.value }))}
                      className="border border-slate-200 rounded px-2 py-1 text-slate-700 outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-400 font-medium">to</span>
                    <input
                      type="date"
                      value={customDates.endDate}
                      onChange={(e) => setCustomDates(prev => ({ ...prev, endDate: e.target.value }))}
                      className="border border-slate-200 rounded px-2 py-1 text-slate-700 outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#f0f4f8] rounded-xl p-4 sm:p-6 border border-slate-200">
              {/* FIX: don't jump to 4 columns until lg, so each card gets enough
                  width on typical laptop screens (was xl:grid-cols-4 only,
                  which meant 4 cramped columns as soon as xl hit). */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* Total Orders Card */}
                {/* FIX: overflow-hidden on every card so nothing inside can ever
                    visually spill into a neighboring card. */}
                <div className="bg-[#eef2f6] rounded-xl p-5 flex items-center border border-blue-100 overflow-hidden min-w-0">
                  <div className="w-12 h-12 rounded-full bg-[#4a90e2] flex items-center justify-center text-white shrink-0 mr-4 shadow-sm">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1e3a8a] mb-1 uppercase tracking-wide truncate">Total Orders</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-2xl font-black text-[#1e3a8a] leading-none">{stats?.totalOrders || 0}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Orders</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Installments Card */}
                <div className="bg-[#f5f3ff] rounded-xl p-5 flex items-center border border-purple-100 relative group overflow-hidden min-w-0">
                  <div className="w-12 h-12 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white shrink-0 mr-4 shadow-sm">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* FIX: this row was the exact spot the "14,464.00 kr." badge was
                        escaping from. flex-wrap + gap lets label and badge wrap onto
                        their own line instead of overflowing the card when tight,
                        and min-w-0 + truncate keeps the label itself from forcing
                        the row wider than the card. */}
                    <div className="flex flex-wrap justify-between items-center gap-1 mb-1">
                      <p className="text-xs font-bold text-[#5b21b6] uppercase tracking-wide truncate">Installments</p>
                      <span className="text-[10px] font-extrabold text-[#7c3aed] bg-purple-200/50 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                        {formatCurrency(stats?.installmentTotalValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end gap-2">
                      <div className="min-w-0">
                        <p className="text-2xl font-black text-[#5b21b6] leading-none">{stats?.installmentOrdersCount || 0}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Orders</p>
                      </div>
                      <div className="text-right min-w-0">
                        <p className="text-sm font-black text-emerald-600 leading-none truncate">{formatCurrency(stats?.installmentTotalCollected)}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1 truncate">
                          Paid <span className="text-amber-600 font-bold">({formatCurrency(stats?.installmentRemainingAmount)} Rem.)</span>
                        </p>
                      </div>
                    </div>

                    {/* Hover Tooltip for Detailed Financial Breakdown */}
                    <div className="absolute left-1/2 -bottom-2 translate-y-full -translate-x-1/2 hidden group-hover:block z-30 w-64 max-w-[calc(100vw-3rem)] p-3 bg-slate-900 text-white rounded-xl shadow-2xl text-xs space-y-1.5 pointer-events-none transition-all duration-200 border border-slate-700">
                      <div className="font-bold border-b border-slate-700 pb-1 text-purple-300 text-[11px] flex justify-between">
                        <span>Installments Breakdown</span>
                        <span>{stats?.installmentOrdersCount || 0} Orders</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">Down Payment (Paid):</span>
                        <span className="font-bold text-emerald-400">{formatCurrency(stats?.installmentDownPaymentPaid)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">Rates Paid:</span>
                        <span className="font-bold text-emerald-400">{formatCurrency(stats?.installmentRatesPaid)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">Remaining (Unpaid):</span>
                        <span className="font-bold text-amber-400">{formatCurrency(stats?.installmentRemainingAmount)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800">
                        <span className="text-slate-300 font-bold">Total Order Value:</span>
                        <span className="font-bold text-purple-300">{formatCurrency(stats?.installmentTotalValue)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Card */}
                <div className="bg-[#fdf8f4] rounded-xl p-5 flex items-center border border-orange-100 overflow-hidden min-w-0">
                  <div className="w-12 h-12 rounded-full bg-[#f59e0b] flex items-center justify-center text-white shrink-0 mr-4 shadow-sm">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#78350f] mb-1 uppercase tracking-wide truncate">Total Revenue</p>
                    <div className="flex justify-between items-end">
                      <div className="min-w-0">
                        <p className="text-xl font-black text-[#78350f] leading-none truncate">{formatCurrency(stats?.totalRevenue)}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">{activeFilter === 'all' ? 'Lifetime' : 'Filtered'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marketing Card */}
                <div className="bg-[#f1f8f5] rounded-xl p-5 flex items-center border border-green-100 overflow-hidden min-w-0">
                  <div className="w-12 h-12 rounded-full bg-[#5cb85c] flex items-center justify-center text-white shrink-0 mr-4 shadow-sm">
                    <CalendarCheck className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#2d6a4f] mb-1 uppercase tracking-wide truncate">Marketing</p>
                    <div className="flex justify-between items-end gap-2">
                      <div className="min-w-0">
                        <p className="text-2xl font-black text-[#2d6a4f] leading-none">{stats?.smsConsentCount || 0}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">SMS Consents</p>
                      </div>
                      <div className="text-right min-w-0">
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

            <div className="bg-white rounded border border-slate-200 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
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
        {/* FIX: min-w-0 + w-full so the sidebar can't be squeezed/pushed by the
            fixed lg:w-[300px] rule when the row briefly overflows on resize. */}
        <aside className="lg:w-[300px] w-full shrink-0 min-w-0">
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
              <div key={status.id} className="p-4 rounded-xl flex items-center border shadow-sm bg-white hover:border-slate-300 transition-colors overflow-hidden min-w-0">
                <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 mr-4 shadow-sm border border-slate-100" style={{ backgroundColor: status.color + '15' }}>
                  <Activity className="h-4 w-4" style={{ color: status.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1 truncate">{status.name}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-black text-slate-800 leading-none">{status.count}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
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