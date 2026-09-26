import React, { useState, useEffect } from 'react';
import { Search, Users, Mail, Phone, Calendar, ShoppingBag, RefreshCw, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const WebshopCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    confirmText: 'Delete',
    loading: false,
    onConfirm: null,
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/webshop/admin/customers`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch webshop customers');
      }
    } catch (error) {
      console.error('Error fetching webshop customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      notes: customer.notes || '',
    });
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      setSavingCustomer(true);
      const res = await fetch(`${API_URL}/webshop/admin/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Customer updated successfully');
        setEditingCustomer(null);
        fetchCustomers();
      } else {
        toast.error(data.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleRequestDelete = (customer) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Customer',
      message: `Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Customer',
      loading: false,
      onConfirm: () => executeDeleteCustomer(customer.id),
    });
  };

  const executeDeleteCustomer = async (customerId) => {
    try {
      setConfirmModal((prev) => ({ ...prev, loading: true }));
      const res = await fetch(`${API_URL}/webshop/admin/customers/${customerId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Customer deleted successfully');
        setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        fetchCustomers();
      } else {
        toast.error(data.message || 'Failed to delete customer');
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, limit]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  const totalPages = Math.ceil(filteredCustomers.length / limit) || 1;
  const paginatedCustomers = filteredCustomers.slice((page - 1) * limit, page * limit);

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={fetchCustomers}
          className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 h-9 w-9 rounded border border-slate-200 transition-colors"
          title="Refresh customers"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded border border-slate-200 overflow-x-auto relative">
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden z-20">
            <div className="h-full bg-blue-500 animate-pulse w-1/3 rounded-r-full" />
          </div>
        )}

        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#fafafa] border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500">Customer Name</th>
              <th className="px-6 py-4 font-bold text-slate-500">Email Address</th>
              <th className="px-6 py-4 font-bold text-slate-500">Phone</th>
              <th className="px-6 py-4 font-bold text-slate-500">Total Orders</th>
              <th className="px-6 py-4 font-bold text-slate-500">Total Spent</th>
              <th className="px-6 py-4 font-bold text-slate-500">Joined Date</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.length === 0 && !loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-slate-500 font-medium">
                  No webshop customers found.
                </td>
              </tr>
            ) : (
              paginatedCustomers.map((customer) => {
                const ordersList = Array.isArray(customer.orders) ? customer.orders : [];
                const totalSpent = ordersList.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

                return (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{customer.name}</td>
                    <td className="px-6 py-4 text-slate-600">{customer.email}</td>
                    <td className="px-6 py-4 text-slate-600">{customer.phone || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{ordersList.length} orders</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{totalSpent.toFixed(2)} DKK</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(customer.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(customer)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRequestDelete(customer)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
        <div className="flex items-center gap-2 text-slate-600">
          <span>Show</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-500 bg-white font-bold"
          >
            {[5, 10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>

        <div className="text-slate-500 font-medium">
          {filteredCustomers.length > 0 ? (
            <>
              Showing <span className="font-bold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(page * limit, filteredCustomers.length)}</span> of{' '}
              <span className="font-bold text-slate-800">{filteredCustomers.length}</span> customers
            </>
          ) : (
            'No customers to display'
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, index, array) => {
                const showEllipsis = index > 0 && p - array[index - 1] > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-2 text-slate-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                        page === p
                          ? 'bg-[#1e3a8a] text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 shrink-0 bg-white">
              <h3 className="text-base font-bold text-slate-900">Edit Customer Details</h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    placeholder="Optional phone number"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Notes / Address</label>
                  <textarea
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    placeholder="Additional notes"
                  />
                </div>
              </div>

              <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-xs font-bold hover:bg-[#1e3a8a]/90 transition-colors disabled:opacity-50"
                >
                  {savingCustomer ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default WebshopCustomersPage;
