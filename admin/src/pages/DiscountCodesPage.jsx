import React, { useState, useEffect, useRef } from 'react';
import { getDiscountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode } from '../services/admin.service';
import { Loader2, Search, Plus, MoreHorizontal, Edit2, Trash2, X } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const DiscountCodesPage = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  
  // Create / Edit Form State
  const [form, setForm] = useState({ code: '', type: 'PERCENTAGE', value: 10, expiresAt: '', phoneNumber: '' });
  const [saving, setSaving] = useState(false);
  
  // Edit Modal State
  const [editingCode, setEditingCode] = useState(null);
  const [editForm, setEditForm] = useState({ code: '', type: 'PERCENTAGE', value: 10, expiresAt: '', phoneNumber: '' });
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, code: null });
  const [deleting, setDeleting] = useState(false);

  // Active Dropdown Action Menu State
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const load = () => {
    setLoading(true);
    getDiscountCodes()
      .then(setCodes)
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load discount codes');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createDiscountCode(form);
      toast.success('Discount code created successfully');
      setShowForm(false);
      setForm({ code: '', type: 'PERCENTAGE', value: 10, expiresAt: '', phoneNumber: '' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create discount code.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (c) => {
    setActiveMenuId(null);
    setEditingCode(c);
    const expDate = c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : '';
    setEditForm({
      code: c.code,
      type: c.type || 'PERCENTAGE',
      value: c.value,
      expiresAt: expDate,
      phoneNumber: c.phoneNumber || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCode) return;
    setSaving(true);
    try {
      await updateDiscountCode(editingCode.id, editForm);
      toast.success('Discount code updated successfully');
      setEditingCode(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update discount code.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartDelete = (c) => {
    setActiveMenuId(null);
    setDeleteModal({ isOpen: true, code: c });
  };

  const handleConfirmDelete = async () => {
    const c = deleteModal.code;
    if (!c) return;
    setDeleting(true);
    try {
      await deleteDiscountCode(c.id);
      toast.success(`Discount code "${c.code}" deleted successfully`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete discount code');
    } finally {
      setDeleting(false);
      setDeleteModal({ isOpen: false, code: null });
    }
  };

  const filteredCodes = codes.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase()) || 
    (c.phoneNumber && c.phoneNumber.includes(search))
  );

  const totalItems = filteredCodes.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedCodes = filteredCodes.slice(startIndex, startIndex + pageSize);

  if (loading && codes.length === 0) {
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
            placeholder="Search coupon code or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); setEditingCode(null); }}
          className={cn(
            "flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors",
            showForm ? "bg-slate-500 hover:bg-slate-600" : "bg-[#7cb342] hover:bg-[#689f38]"
          )}
        >
          {showForm ? 'CANCEL' : <><Plus className="h-4 w-4" /> ADD COUPON</>}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-[#f0f4f8] p-6 rounded border border-slate-200 mb-6 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Create New Coupon</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Coupon Code</label>
              <input 
                placeholder="e.g. SUMMER25" 
                value={form.code} 
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Discount Type</label>
              <select 
                value={form.type} 
                onChange={e => setForm({ ...form, type: e.target.value })} 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Value</label>
              <input 
                type="number" 
                value={form.value} 
                onChange={e => setForm({ ...form, value: e.target.value })} 
                required 
                min="1"
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Expiry Date</label>
              <input 
                type="date" 
                value={form.expiresAt} 
                onChange={e => setForm({ ...form, expiresAt: e.target.value })} 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
            <div>
              <button type="submit" disabled={saving} className="w-full bg-[#1e3a8a] text-white text-xs font-bold px-4 py-2.5 rounded shadow-sm hover:bg-blue-800 transition-colors flex items-center justify-center">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'SAVE'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editingCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#fafafa]">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" /> Edit Coupon #{editingCode.id}
              </h3>
              <button 
                onClick={() => setEditingCode(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Coupon Code</label>
                <input 
                  type="text"
                  value={editForm.code} 
                  onChange={e => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })} 
                  required 
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Discount Type</label>
                  <select 
                    value={editForm.type} 
                    onChange={e => setEditForm({ ...editForm, type: e.target.value })} 
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Value</label>
                  <input 
                    type="number" 
                    value={editForm.value} 
                    onChange={e => setEditForm({ ...editForm, value: e.target.value })} 
                    required 
                    min="1"
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Expiry Date</label>
                <input 
                  type="date" 
                  value={editForm.expiresAt} 
                  onChange={e => setEditForm({ ...editForm, expiresAt: e.target.value })} 
                  required 
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setEditingCode(null)}
                  className="px-4 py-2 rounded text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#1e3a8a] text-white text-sm font-bold px-5 py-2 rounded shadow-sm hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-visible">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fafafa] border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500">Coupon ID</th>
              <th className="px-6 py-4 font-bold text-slate-500">Coupon Code</th>
              <th className="px-6 py-4 font-bold text-slate-500">Limit Used</th>
              <th className="px-6 py-4 font-bold text-slate-500">Used In Order</th>
              <th className="px-6 py-4 font-bold text-slate-500">Applied To</th>
              <th className="px-6 py-4 font-bold text-slate-500">Expiry Date</th>
              <th className="px-6 py-4 font-bold text-slate-500 w-16 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedCodes.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-slate-500 font-medium">No coupons found.</td>
              </tr>
            ) : (
              paginatedCodes.map((c) => {
                const used = !!c.usedAt;
                const isMenuOpen = activeMenuId === c.id;
                
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors relative">
                    <td className="px-6 py-4 text-slate-700 font-medium">{c.id}</td>
                    <td className="px-6 py-4">
                      <span className="bg-[#f0f8f1] text-[#2d6a4f] px-2.5 py-1 rounded text-xs font-bold tracking-wide font-mono">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-bold">
                       {used ? '1' : '0'} <span className="text-slate-400 font-normal ml-1">/ 1</span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{used ? '1' : '0'}</td>
                    <td className="px-6 py-4 text-slate-700">advance</td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                         <span className="text-slate-700">
                           {new Date(c.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                         </span>
                         <span className="text-[10px] text-slate-400 font-medium mt-0.5">12:00 AM</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : c.id);
                        }}
                        className={cn(
                          "p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors",
                          isMenuOpen && "bg-slate-100 text-slate-700"
                        )}
                        title="Actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {/* Dropdown Action Menu */}
                      {isMenuOpen && (
                        <div 
                          ref={menuRef}
                          className="absolute right-6 top-10 w-36 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-left animate-in fade-in zoom-in-95 duration-150"
                        >
                          <button
                            onClick={() => handleStartEdit(c)}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-blue-600" /> Edit
                          </button>
                          <button
                            onClick={() => handleStartDelete(c)}
                            className="w-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" /> Delete
                          </button>
                        </div>
                      )}
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
        <div className="flex items-center gap-2 text-slate-600">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
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
        <div className="text-slate-500 font-medium">
          {totalItems > 0 ? (
            <>
              Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-800">{totalItems}</span> coupons
            </>
          ) : (
            'No coupons to display'
          )}
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {/* Page numbers list */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
            })
            .map((page, index, array) => {
              const showEllipsis = index > 0 && page - array[index - 1] > 1;
              return (
                <React.Fragment key={page}>
                  {showEllipsis && <span className="px-2 text-slate-400">...</span>}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-bold transition-all",
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Coupon Code"
        message={`Are you sure you want to delete coupon code "${deleteModal.code?.code}"? Note: If this coupon has been used in completed orders, deletion will be prevented.`}
        confirmText="Yes, Delete Coupon"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, code: null })}
        isLoading={deleting}
        isDestructive={true}
      />
    </div>
  );
};

export default DiscountCodesPage;
