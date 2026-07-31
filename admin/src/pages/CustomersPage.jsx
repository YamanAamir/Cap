import React, { useState, useEffect } from 'react';
import { getCustomers, updateCustomer, deleteCustomer } from '../services/admin.service';
import { Loader2, Search, Plus, MoreHorizontal, Edit2, Trash2, X, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';

const CustomersPage = () => {
  const [data, setData] = useState({ customers: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  // Modals state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, customerId: null });
  const [editModal, setEditModal] = useState({ isOpen: false, customer: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = () => {
    setLoading(true);
    getCustomers({ search: debounced })
      .then(setData)
      .catch(error => {
        console.error(error);
        toast.error('Failed to fetch customers');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [debounced]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomer(deleteModal.customerId);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, customerId: null });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateCustomer(editModal.customer.id, {
        name: editModal.customer.name,
        email: editModal.customer.email,
        phone: editModal.customer.phone,
        orderEmailConsent: editModal.customer.orderEmailConsent,
        smsMarketingConsent: editModal.customer.smsMarketingConsent,
        emailMarketingConsent: editModal.customer.emailMarketingConsent,
      });
      toast.success('Customer updated successfully');
      fetchCustomers();
      setEditModal({ isOpen: false, customer: null });
    } catch (error) {
      toast.error('Failed to update customer');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading && !data.customers.length) {
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
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button 
          className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors bg-[#7cb342] hover:bg-[#689f38]"
        >
          <Plus className="h-4 w-4" /> NEW USER
        </button>
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
              <th className="px-6 py-4 font-bold text-slate-500">Name</th>
              <th className="px-6 py-4 font-bold text-slate-500">Contact Vectors</th>
              <th className="px-6 py-4 font-bold text-slate-500">Permissions & Consent</th>
              <th className="px-6 py-4 font-bold text-slate-500">Order Vol.</th>
              <th className="px-6 py-4 font-bold text-slate-500">Enrolled Date</th>
              <th className="px-6 py-4 font-bold text-slate-500 w-12 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.customers.length === 0 && !loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">No customers found.</td>
              </tr>
            ) : (
              data.customers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 uppercase border border-blue-100 text-xs">
                         {c.name.charAt(0)}
                       </div>
                       <span className="font-bold text-slate-700">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-slate-600 font-medium">{c.email}</span>
                      <span className="text-xs text-slate-400 font-medium">{c.phone || 'No phone'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {c.orderEmailConsent && (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-slate-200">
                          Order Mail
                        </span>
                      )}
                      {c.smsMarketingConsent && !c.smsOptOut && (
                        <span className="bg-[#f0f8f1] text-[#2d6a4f] px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-green-100">
                          SMS Opt-in
                        </span>
                      )}
                      {c.emailMarketingConsent && (
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-blue-100">
                          Promo Mail
                        </span>
                      )}
                      {c.smsOptOut && (
                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-red-100">
                          Revoked SMS
                        </span>
                      )}
                      {!c.orderEmailConsent && !c.smsMarketingConsent && !c.emailMarketingConsent && !c.smsOptOut && (
                        <span className="text-xs font-bold text-slate-300 uppercase">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-700">{c._count?.orders ?? 0}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-center relative">
                    <button 
                      className="p-1 hover:bg-slate-100 rounded"
                      onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === c.id ? null : c.id); }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {activeDropdown === c.id && (
                      <div className="absolute right-6 top-10 bg-white border border-slate-200 rounded shadow-lg z-10 w-32 py-1">
                        <button 
                          className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          onClick={() => setEditModal({ isOpen: true, customer: c })}
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 flex items-center gap-2 text-red-600"
                          onClick={() => setDeleteModal({ isOpen: true, customerId: c.id })}
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
      
      <div className="mt-4 text-right">
        <p className="text-xs text-slate-500 font-bold">
          Showing <span className="text-slate-700">{data.customers.length}</span> of <span className="text-slate-700">{data.pagination?.totalCount || data.customers.length}</span> records
        </p>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText="Delete Customer"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, customerId: null })}
      />

      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#fafafa]">
              <h3 className="text-sm font-bold text-slate-800">Edit Customer {editModal.customer.name}</h3>
              <button onClick={() => setEditModal({ isOpen: false, customer: null })} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editModal.customer.name}
                  onChange={(e) => setEditModal({ ...editModal, customer: { ...editModal.customer, name: e.target.value }})}
                  className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" 
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                <input 
                  type="email" 
                  value={editModal.customer.email}
                  onChange={(e) => setEditModal({ ...editModal, customer: { ...editModal.customer, email: e.target.value }})}
                  className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" 
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                <input 
                  type="text" 
                  value={editModal.customer.phone || ''}
                  onChange={(e) => setEditModal({ ...editModal, customer: { ...editModal.customer, phone: e.target.value }})}
                  className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" 
                />
              </div>
              
              <div className="space-y-2 mt-4 border-t pt-4">
                <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editModal.customer.orderEmailConsent}
                    onChange={(e) => setEditModal({ ...editModal, customer: { ...editModal.customer, orderEmailConsent: e.target.checked }})}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Order Email Consent</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editModal.customer.smsMarketingConsent}
                    onChange={(e) => setEditModal({ ...editModal, customer: { ...editModal.customer, smsMarketingConsent: e.target.checked }})}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>SMS Marketing Consent</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editModal.customer.emailMarketingConsent}
                    onChange={(e) => setEditModal({ ...editModal, customer: { ...editModal.customer, emailMarketingConsent: e.target.checked }})}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Email Marketing Consent</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setEditModal({ isOpen: false, customer: null })}
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

export default CustomersPage;
