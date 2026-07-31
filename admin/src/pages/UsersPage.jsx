import React, { useState, useEffect } from 'react';
import { Loader2, User, Plus, Edit2, Trash2, Shield, X, Save } from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/common/ConfirmModal';
import { cn } from '@/lib/utils';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ id: null, name: '', email: '', password: '', role: 'viewer' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/admin/users/${form.id}`, form);
      } else {
        await api.post('/admin/users', form);
      }
      setForm({ id: null, name: '', email: '', password: '', role: 'viewer' });
      setShowForm(false);
      loadUsers();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setForm({ id: user.id, name: user.name, email: user.email, password: '', role: user.role });
    setShowForm(true);
  };

  const handleDeleteClick = (id, name) => {
    setConfirmModal({ isOpen: true, id, name });
  };

  const executeDelete = async () => {
    if (!confirmModal.id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/users/${confirmModal.id}`);
      loadUsers();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
      setConfirmModal({ isOpen: false, id: null, name: '' });
    }
  };

  if (loading && !users.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Users & Roles</h2>
          <p className="text-sm text-slate-500">Manage admin access and permission scopes.</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) setForm({ id: null, name: '', email: '', password: '', role: 'viewer' });
          }} 
          className={cn(
            "flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors",
            showForm ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-[#1e3a8a] text-white hover:bg-blue-800"
          )}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} 
          {showForm ? 'CANCEL' : 'ADD NEW USER'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white border border-slate-200 rounded animate-in slide-in-from-top-2 fade-in duration-300 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">{form.id ? 'Edit User' : 'Create Admin User'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Full Name</label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-700" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Email Address</label>
              <input 
                type="email" 
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-700" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                Password {form.id && <span className="text-slate-400 font-normal lowercase">(leave blank to keep current)</span>}
              </label>
              <input 
                type="password" 
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                required={!form.id} 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-700" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Role / Permissions Scope</label>
              <select 
                value={form.role} 
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-700 bg-white"
              >
                <option value="superadmin">Super Admin (All Access)</option>
                <option value="manager">Manager (Manage Orders & Production)</option>
                <option value="viewer">Viewer (Read Only Analytics)</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              disabled={saving}
              className="md:col-span-2 mt-2 bg-[#7cb342] text-white text-xs font-bold px-6 py-3 rounded shadow-sm hover:bg-[#689f38] transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {form.id ? 'UPDATE USER' : 'CREATE USER'}
            </button>
          </form>
        </div>
      )}

      {/* Users List */}
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
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role scope</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Added</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 && !loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500 text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Shield className={cn("h-4 w-4", user.role === 'superadmin' ? 'text-blue-500' : 'text-slate-400')} />
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                          user.role === 'superadmin' ? "bg-blue-100 text-blue-800" : 
                          user.role === 'manager' ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        )}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.id, user.name)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        title="Delete User"
        message={`Are you sure you want to delete ${confirmModal.name}? This action will permanently remove their access.`}
        confirmText="Delete User"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null, name: '' })}
      />
    </div>
  );
};

export default UsersPage;
