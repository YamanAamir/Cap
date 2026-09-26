import React, { useState, useEffect } from 'react';
import { Loader2, Package, ShoppingCart, ShoppingBag, Users, Mail, ArrowRight, Clock, CheckCircle2, Truck, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const WebshopDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/webshop/admin/stats`);
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching webshop dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0) + ' kr.';

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#1e3a8a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12 space-y-8">
      
      {/* Overview Analytics Section */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Webshop Dashboard Overview</h2>

        <div className="bg-[#f0f4f8] rounded-xl p-4 sm:p-6 border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Revenue Card */}
            <div className="bg-[#fdf8f4] rounded-xl p-5 flex items-center border border-orange-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#f59e0b] flex items-center justify-center text-white shrink-0 mr-4 shadow-sm">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#78350f] mb-1 uppercase tracking-wide">Webshop Revenue</p>
                <div>
                  <p className="text-xl font-black text-[#78350f] leading-none">{formatCurrency(stats?.totalRevenue)}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">Stripe Confirmed</p>
                </div>
              </div>
            </div>

            {/* Total Orders Card */}
            <div className="bg-[#eef2f6] rounded-xl p-5 flex items-center border border-blue-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#4a90e2] flex items-center justify-center text-white shrink-0 mr-4 shadow-sm">
                <Package className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#1e3a8a] mb-1 uppercase tracking-wide">Total Orders</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-black text-[#1e3a8a] leading-none">{stats?.totalOrders || 0}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">All Time</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-600">{stats?.pendingOrders || 0} Pending</p>
                    <p className="text-xs font-bold text-indigo-600">{stats?.shippedOrders || 0} Shipped</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Catalog Card */}
            <div className="bg-[#f1f8f5] rounded-xl p-5 flex items-center border border-green-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#5cb85c] flex items-center justify-center text-white shrink-0 mr-4 shadow-sm">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#2d6a4f] mb-1 uppercase tracking-wide">Catalog Products</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-black text-[#2d6a4f] leading-none">{stats?.totalProducts || 0}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Total Items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-600">{stats?.activeProducts || 0} Active</p>
                    <p className="text-xs font-bold text-red-600">{stats?.outOfStockProducts || 0} Out Stock</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customers Directory Card */}
            <div className="bg-[#f5f3ff] rounded-xl p-5 flex items-center border border-purple-100 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white shrink-0 mr-4 shadow-sm">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#5b21b6] mb-1 uppercase tracking-wide">Webshop Customers</p>
                <div>
                  <p className="text-2xl font-black text-[#5b21b6] leading-none">{stats?.totalCustomers || 0}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">Purchased Users</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Quick Action Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/dashboard/webshop/products"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-[#1e3a8a] rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Product Catalog</div>
              <div className="text-xs text-slate-500">Manage items & stock</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/dashboard/webshop/orders"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Webshop Orders</div>
              <div className="text-xs text-slate-500">View & process orders</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/dashboard/webshop/customers"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Customer Directory</div>
              <div className="text-xs text-slate-500">View webshop buyers</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/dashboard/webshop/emails"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Email & Statuses</div>
              <div className="text-xs text-slate-500">Configure templates & triggers</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      {/* Recent Orders Section */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Webshop Orders</h3>
            <p className="text-xs text-slate-500">Latest transactions confirmed via Stripe</p>
          </div>
          <Link
            to="/dashboard/webshop/orders"
            className="text-xs font-bold text-[#1e3a8a] hover:underline flex items-center gap-1"
          >
            View All Webshop Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2 border border-dashed rounded-xl">
            <Package className="w-8 h-8 text-slate-300" />
            <p className="font-medium text-slate-600 text-sm">No webshop orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Customer Email</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {stats.recentOrders.map((order) => {
                  const custName = order.customerDetails?.name || order.webshopCustomer?.name || 'Customer';
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1e3a8a]">{order.orderNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{custName}</td>
                      <td className="py-3 px-4 text-slate-600">{order.customerEmail}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{order.totalAmount} {order.currency}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
};

export default WebshopDashboardPage;
