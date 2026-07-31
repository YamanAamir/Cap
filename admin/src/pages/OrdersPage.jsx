import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, deleteOrder, updateOrder } from '../services/auth.service';
import { getOrderStatuses } from '../services/admin.service';
import { Search, Loader2, Filter, MoreHorizontal, RefreshCw, Trash2, Edit2, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';

const OrdersPage = () => {
  const [data, setData] = useState({ orders: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [debounceSearch, setDebounceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statuses, setStatuses] = useState([]);
  const navigate = useNavigate();

  // Modals state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, orderId: null });
  const [editModal, setEditModal] = useState({ isOpen: false, order: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    getOrderStatuses().then(setStatuses).catch(console.error);
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
        sortBy,
        order,
        limit: 20,
        statusId: statusFilter,
      });
      setData(response);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, debounceSearch, sortBy, order, statusFilter]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteOrder(deleteModal.orderId);
      toast.success('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, orderId: null });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateOrder(editModal.order.id, {
        customerEmail: editModal.order.customerEmail,
        totalPrice: editModal.order.totalPrice,
        statusId: editModal.order.statusId,
      });
      toast.success('Order updated successfully');
      fetchOrders();
      setEditModal({ isOpen: false, order: null });
    } catch (error) {
      toast.error('Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading && !data.orders.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full sm:w-48 pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="all">All Statuses</option>
                {statuses.filter(s => s.isActive).map(s => (
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

      {/* Table Section */}
      <div className="bg-white rounded border border-slate-200 overflow-x-auto relative">
        {loading && (
           <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden z-20">
             <div className="h-full bg-blue-500 animate-pulse w-1/3 rounded-r-full"></div>
           </div>
        )}
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#fafafa] border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500 cursor-pointer hover:text-blue-600" onClick={() => handleSort('orderNumber')}>
                Order # {sortBy === 'orderNumber' && (order === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-4 font-bold text-slate-500">Date</th>
              <th className="px-6 py-4 font-bold text-slate-500">Customer Details</th>
              <th className="px-6 py-4 font-bold text-slate-500">Current Status</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-right cursor-pointer hover:text-blue-600" onClick={() => handleSort('totalPrice')}>
                Total Amount {sortBy === 'totalPrice' && (order === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-4 font-bold text-slate-500 w-12 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.orders.length === 0 && !loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">No orders found.</td>
              </tr>
            ) : (
              data.orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-700">{order.customerEmail}</span>
                      <span className="text-xs text-slate-400">ID: {order.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-2.5 py-1 rounded text-xs font-bold tracking-wide"
                      style={{
                        backgroundColor: `${order.orderStatus?.color || '#6366f1'}15`,
                        color: order.orderStatus?.color || '#6366f1',
                      }}
                    >
                      {order.orderStatus?.name || order.status?.replace(/_/g, ' ') || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">
                    {new Intl.NumberFormat('da-DK', { style: 'currency', currency: order.currency || 'DKK' }).format(order.totalPrice)}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-center relative">
                    <button 
                      className="p-1 hover:bg-slate-100 rounded" 
                      onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === order.id ? null : order.id); }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {activeDropdown === order.id && (
                      <div className="absolute right-6 top-10 bg-white border border-slate-200 rounded shadow-lg z-10 w-32 py-1">
                        <button 
                          className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          onClick={() => setEditModal({ isOpen: true, order })}
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 flex items-center gap-2 text-red-600"
                          onClick={() => setDeleteModal({ isOpen: true, orderId: order.id })}
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500 font-bold">
          Showing <span className="text-slate-700">{data.orders.length}</span> of <span className="text-slate-700">{data.pagination.totalCount || 0}</span> orders
        </p>
        
        {/* Simple Pagination */}
        <div className="flex gap-1">
           <button 
             disabled={page === 1}
             onClick={() => setPage(page - 1)}
             className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded text-sm hover:bg-slate-50 disabled:opacity-50"
           >
             Prev
           </button>
           <button 
             disabled={!data.pagination.totalPages || page === data.pagination.totalPages}
             onClick={() => setPage(page + 1)}
             className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded text-sm hover:bg-slate-50 disabled:opacity-50"
           >
             Next
           </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete Order"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, orderId: null })}
      />

      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#fafafa]">
              <h3 className="text-sm font-bold text-slate-800">Edit Order {editModal.order.orderNumber}</h3>
              <button onClick={() => setEditModal({ isOpen: false, order: null })} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Customer Email</label>
                <input 
                  type="email" 
                  value={editModal.order.customerEmail}
                  onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order, customerEmail: e.target.value }})}
                  className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" 
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Total Price (DKK)</label>
                <input 
                  type="number" 
                  value={editModal.order.totalPrice}
                  onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order, totalPrice: e.target.value }})}
                  className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" 
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                <select 
                  value={editModal.order.statusId || ''}
                  onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order, statusId: e.target.value }})}
                  className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">Select Status</option>
                  {statuses.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setEditModal({ isOpen: false, order: null })}
                  className="px-4 py-2 rounded text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="px-4 py-2 rounded text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrdersPage;
