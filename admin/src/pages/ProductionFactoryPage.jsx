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
  const [debounceSearch, setDebounceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
        limit: 20,
        statusId: statusFilter,
        isVisibleToProduction: 'true'
      });
      setData(response);
    } catch (error) {
      toast.error('Failed to load production queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, debounceSearch, statusFilter]);

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
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800">Production Queue</h2>
           <p className="text-sm text-slate-500">Manage orders currently in the factory pipeline.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-[250px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search order or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
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

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500 font-bold">
          Showing <span className="text-slate-700">{data.orders.length}</span> orders
        </p>
        <div className="flex gap-1">
           <button 
             disabled={page === 1}
             onClick={() => setPage(page - 1)}
             className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded text-sm hover:bg-slate-50 disabled:opacity-50"
           >Prev</button>
           <button 
             disabled={!data.pagination.totalPages || page === data.pagination.totalPages}
             onClick={() => setPage(page + 1)}
             className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded text-sm hover:bg-slate-50 disabled:opacity-50"
           >Next</button>
        </div>
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
