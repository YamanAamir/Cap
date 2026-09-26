import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, updateOrderStatus } from '../services/auth.service';
import { getOrderStatuses } from '../services/admin.service';
import { Loader2, Search, Filter, RefreshCw, ImageIcon } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const safeParseJSON = (jsonString) => {
  if (!jsonString) return {};
  if (typeof jsonString === 'object') return jsonString;
  try { return JSON.parse(jsonString); } catch (e) { return { _raw: jsonString }; }
};

const ProductionFactoryPage = () => {
  const [data, setData] = useState({ orders: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [debounceSearch, setDebounceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'month' | 'custom'
  const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' });
  const [statuses, setStatuses] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderId: null, statusId: null });
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getOrderStatuses().then(res => {
      // Only production-visible statuses
      setStatuses(res.filter(s => s.isVisibleToProduction));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebounceSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await getOrders({
        page,
        search: debounceSearch,
        limit,
        statusId: statusFilter,
        isVisibleToProduction: 'true',
        dateFilter,
        startDate: customDates.startDate,
        endDate: customDates.endDate,
      });
      setData(response);
    } catch (error) {
      console.error('Failed to fetch factory orders:', error);
      toast.error('Failed to load production queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debounceSearch, statusFilter, limit, dateFilter, customDates.startDate, customDates.endDate]);

  useEffect(() => {
    fetchOrders();
  }, [page, debounceSearch, statusFilter, limit, dateFilter, customDates.startDate, customDates.endDate]);

  const handleStatusUpdate = async () => {
    if (!confirmModal.orderId || !confirmModal.statusId) return;
    setUpdatingId(confirmModal.orderId);
    try {
      await updateOrderStatus(confirmModal.orderId, { statusId: parseInt(confirmModal.statusId) });
      toast.success('Status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
      setConfirmModal({ isOpen: false, orderId: null, statusId: null });
    }
  };

  if (loading && !data.orders.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 max-w-[1400px] mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Production Queue</h2>
          <p className="text-sm text-slate-500">Manage orders currently in the factory pipeline.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/factory/media')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-800 hover:from-blue-950 hover:to-indigo-900 text-white font-bold text-xs rounded-lg shadow-sm transition-all shrink-0 cursor-pointer self-start sm:self-center"
        >
          <ImageIcon className="w-4 h-4 text-blue-300" />
          Factory Media Gallery
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full sm:w-[220px] md:w-[250px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search order or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded p-1 text-xs max-w-full overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => { setDateFilter('all'); setPage(1); }}
              className={`px-2.5 py-1 rounded font-semibold transition-all whitespace-nowrap ${
                dateFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => { setDateFilter('today'); setPage(1); }}
              className={`px-2.5 py-1 rounded font-semibold transition-all whitespace-nowrap ${
                dateFilter === 'today'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => { setDateFilter('month'); setPage(1); }}
              className={`px-2.5 py-1 rounded font-semibold transition-all whitespace-nowrap ${
                dateFilter === 'month'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => { setDateFilter('custom'); setPage(1); }}
              className={`px-2.5 py-1 rounded font-semibold transition-all whitespace-nowrap ${
                dateFilter === 'custom'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom
            </button>
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2 py-1 text-xs shadow-sm flex-wrap max-w-full">
              <input
                type="date"
                value={customDates.startDate}
                onChange={(e) => { setCustomDates(prev => ({ ...prev, startDate: e.target.value })); setPage(1); }}
                className="border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 outline-none focus:border-blue-500"
              />
              <span className="text-slate-400 font-medium">to</span>
              <input
                type="date"
                value={customDates.endDate}
                onChange={(e) => { setCustomDates(prev => ({ ...prev, endDate: e.target.value })); setPage(1); }}
                className="border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-48 pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="all">All Visible Statuses</option>
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={fetchOrders}
            className={cn("flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 h-9 w-9 rounded border border-slate-200 transition-colors", loading && "opacity-50")}
            title="Refresh orders"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#fafafa] border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500">Order #</th>
              <th className="px-6 py-4 font-bold text-slate-500">Date Received</th>
              <th className="px-6 py-4 font-bold text-slate-500">School / Program</th>
              <th className="px-6 py-4 font-bold text-slate-500">Current Status</th>
              <th className="px-6 py-4 font-bold text-slate-500 w-12 text-center">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.orders.length === 0 && !loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-medium">No production orders found.</td>
              </tr>
            ) : (
              data.orders.map((order) => {
                const customerDetails = safeParseJSON(order.customerDetails);
                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{customerDetails.Skolenavn || order.program || 'N/A'}</span>
                        <span className="text-xs text-slate-400">{order.packageName || 'Standard'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <select
                          value={order.statusId || ''}
                          onChange={(e) => setConfirmModal({ isOpen: true, orderId: order.id, statusId: e.target.value })}
                          disabled={updatingId === order.id}
                          className="px-2.5 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-700 bg-[#fafafa] focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        >
                          {statuses.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                       </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded shadow-sm hover:bg-blue-800 transition-colors flex items-center gap-1.5 mx-auto"
                        onClick={() => navigate(`/dashboard/factory/orders/${order.id}`)}
                      >
                        <ImageIcon className="h-3 w-3" /> View Specs
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="mt-4 px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 text-sm shrink-0">
        {/* Entries display limit selector */}
        <div className="flex items-center gap-2 text-slate-600 text-xs">
          <span>Show</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-500 bg-white font-bold"
          >
            {[5, 10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span>entries</span>
        </div>

        {/* Showing entries info */}
        <div className="text-slate-500 font-medium text-xs">
          {(data.pagination?.totalCount || 0) > 0 ? (
            <>
              Showing <span className="font-bold text-slate-800">{((page - 1) * limit) + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(page * limit, data.pagination?.totalCount || 0)}</span> of{' '}
              <span className="font-bold text-slate-800">{data.pagination?.totalCount || 0}</span> orders
            </>
          ) : (
            'No orders to display'
          )}
        </div>

        {/* Pagination controls */}
        {(data.pagination?.totalPages || 0) > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page numbers list */}
            {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
              .filter(p => {
                return p === 1 || p === data.pagination.totalPages || Math.abs(p - page) <= 1;
              })
              .map((p, index, array) => {
                const showEllipsis = index > 0 && p - array[index - 1] > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-2 text-slate-400 text-xs">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={cn(
                        "px-3 py-1.5 rounded text-xs font-bold transition-all",
                        page === p
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setPage(prev => Math.min(prev + 1, data.pagination.totalPages))}
              disabled={page === data.pagination.totalPages}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Update Order Status"
        message="Are you sure you want to update the status of this order? If an email template is linked to the new status, it will be automatically sent to the customer."
        confirmText="Yes, Update Status"
        isDestructive={false}
        isLoading={!!updatingId}
        onConfirm={handleStatusUpdate}
        onCancel={() => !updatingId && setConfirmModal({ isOpen: false, orderId: null, statusId: null })}
      />
    </div>
  );
};

export default ProductionFactoryPage;

