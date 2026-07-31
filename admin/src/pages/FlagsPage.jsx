import React, { useState, useEffect } from 'react';
import { Flag, Plus, Trash2, Edit2, Save, X, Loader2, RefreshCw, Search, AlertCircle } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import { cn } from '@/lib/utils';
import api from '../services/api';

const FlagsPage = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newFlag, setNewFlag] = useState({ name: '', price: '' });
  const [editValues, setEditValues] = useState({ name: '', price: '' });
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await api.get('/flags');
      setFlags(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleAdd = async () => {
    if (!newFlag.name.trim() || newFlag.price === '') return;
    setSaving(true);
    try {
      await api.post('/flags', { 
        name: newFlag.name.trim(), 
        price: parseFloat(newFlag.price) 
      });
      setNewFlag({ name: '', price: '' });
      await fetchFlags();
    } catch (err) {
      console.error('Error adding flag:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editValues.name.trim()) return;
    setSaving(true);
    try {
      await api.put(`/flags/${id}`, { 
        name: editValues.name.trim(), 
        price: parseFloat(editValues.price) 
      });
      setEditingId(null);
      await fetchFlags();
    } catch (err) {
      console.error('Error updating flag:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id, name) => {
    setConfirmModal({ isOpen: true, id, name });
  };

  const executeDelete = async () => {
    if (!confirmModal.id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/flags/${confirmModal.id}`);
      await fetchFlags();
    } catch (err) {
      console.error('Error deleting flag:', err);
    } finally {
      setIsDeleting(false);
      setConfirmModal({ isOpen: false, id: null, name: '' });
    }
  };

  const startEdit = (flag) => {
    setEditingId(flag.id);
    setEditValues({ name: flag.name, price: flag.price });
  };

  const filteredFlags = flags.filter(flag => 
    flag.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && !flags.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Flags & Pricing</h2>
          <p className="text-sm text-slate-500">Manage flags configurator and pricing in DKK.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search flags..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={fetchFlags}
            className="p-2.5 border border-slate-200 text-slate-600 rounded hover:bg-slate-50 transition-colors shrink-0"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded p-5 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Flag Name</label>
            <input
              type="text"
              placeholder="e.g. Sverige"
              value={newFlag.name}
              onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-800"
            />
          </div>
          <div className="w-full sm:w-48 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Extra Cost (DKK)</label>
            <div className="relative">
              <input
                type="number"
                placeholder="0"
                value={newFlag.price}
                onChange={(e) => setNewFlag({ ...newFlag, price: e.target.value })}
                className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-800"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">DKK</span>
            </div>
          </div>
          <button 
            onClick={handleAdd}
            disabled={saving || !newFlag.name || newFlag.price === ''}
            className={cn(
              "flex items-center justify-center gap-2 text-white text-xs font-bold px-6 py-2.5 rounded transition-colors w-full sm:w-auto h-10 shadow-sm shrink-0",
              saving || !newFlag.name || newFlag.price === '' ? "bg-slate-400 cursor-not-allowed" : "bg-[#7cb342] hover:bg-[#689f38]"
            )}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            ADD FLAG
          </button>
        </div>
      </div>

      {/* Flags Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#fafafa] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-16">
                  #
                </th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Flag Name
                </th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">
                  Price
                </th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFlags.length === 0 && !loading ? (
                <tr>
                  <td colSpan="4" className="px-5 py-12 text-center text-slate-500 text-sm">
                    No flags matching your search.
                  </td>
                </tr>
              ) : (
                filteredFlags.map((flag, index) => (
                  <tr key={flag.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-400 text-sm">{index + 1}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {editingId === flag.id ? (
                        <input
                          type="text"
                          value={editValues.name}
                          onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                          className="w-full max-w-[200px] px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:border-blue-500 font-bold"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                             {flag.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800 text-sm">{flag.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      {editingId === flag.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            value={editValues.price}
                            onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                            className="w-20 px-2 py-1.5 border border-blue-300 rounded text-sm text-right focus:outline-none focus:border-blue-500 font-bold text-green-700"
                          />
                          <span className="text-[10px] font-bold text-slate-500">DKK</span>
                        </div>
                      ) : (
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold",
                          parseFloat(flag.price) === 0 ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"
                        )}>
                          {parseFloat(flag.price) === 0 ? 'FREE' : `+${flag.price} DKK`}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        {editingId === flag.id ? (
                          <>
                            <button 
                              onClick={() => handleUpdate(flag.id)} 
                              disabled={saving}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Save"
                            >
                              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(flag)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(flag.id, flag.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Flag"
        message={`Are you sure you want to delete "${confirmModal.name}"? This action cannot be undone.`}
        confirmText="Delete Flag"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null, name: '' })}
      />
    </div>
  );
};

export default FlagsPage;
