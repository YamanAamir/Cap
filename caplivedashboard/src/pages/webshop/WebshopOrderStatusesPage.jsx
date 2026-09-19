import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, RefreshCw, Link as LinkIcon, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const WebshopOrderStatusesPage = () => {
  const [statuses, setStatuses] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Drag & drop state
  const [draggedStatusIndex, setDraggedStatusIndex] = useState(null);

  // Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusForm, setStatusForm] = useState({
    name: '',
    color: '#6366f1',
    sortOrder: 1,
    webshopEmailTemplateId: '',
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'primary',
    confirmText: 'Confirm',
    loading: false,
    onConfirm: null,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stRes, tplRes] = await Promise.all([
        fetch(`${API_URL}/webshop/admin/statuses`),
        fetch(`${API_URL}/webshop/admin/email-templates`),
      ]);
      const stData = await stRes.json();
      const tplData = await tplRes.json();

      if (stData.success) {
        setStatuses(stData.data || []);
      }
      if (tplData.success) {
        setTemplates(tplData.data || []);
      }
    } catch (error) {
      console.error('Error fetching order statuses:', error);
      toast.error('Failed to load order statuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Drag and drop reordering
  const handleStatusDragStart = (e, index) => {
    setDraggedStatusIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStatusDragOver = (e, index) => {
    e.preventDefault();
    if (draggedStatusIndex === null || draggedStatusIndex === index) return;
    const updated = [...statuses];
    const item = updated[draggedStatusIndex];
    updated.splice(draggedStatusIndex, 1);
    updated.splice(index, 0, item);
    setDraggedStatusIndex(index);
    setStatuses(updated);
  };

  const handleStatusDragEnd = async () => {
    setDraggedStatusIndex(null);
    try {
      const items = statuses.map((s, idx) => ({ id: s.id, sortOrder: idx + 1 }));
      const res = await fetch(`${API_URL}/webshop/admin/statuses/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order statuses reordered & saved');
      } else {
        toast.error(data.message || 'Failed to save order');
      }
    } catch (error) {
      console.error('Error saving reordered statuses:', error);
      toast.error('Failed to persist order to backend');
    }
  };

  const handleOpenCreateStatusModal = () => {
    setEditingStatus(null);
    setStatusForm({
      name: '',
      color: '#6366f1',
      sortOrder: statuses.length + 1,
      webshopEmailTemplateId: '',
    });
    setIsStatusModalOpen(true);
  };

  const handleOpenEditStatusModal = (status) => {
    setEditingStatus(status);
    setStatusForm({
      name: status.name || '',
      color: status.color || '#6366f1',
      sortOrder: status.sortOrder || 1,
      webshopEmailTemplateId: status.webshopEmailTemplateId || '',
    });
    setIsStatusModalOpen(true);
  };

  const handleRequestSaveStatus = (e) => {
    e.preventDefault();
    if (!statusForm.name) {
      toast.error('Status Name is required');
      return;
    }

    const isEdit = Boolean(editingStatus);
    if (!isEdit) {
      executeSaveStatus();
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Update Order Status',
        message: `Are you sure you want to update status "${statusForm.name}"?`,
        type: 'primary',
        confirmText: 'Save Status',
        loading: false,
        onConfirm: executeSaveStatus,
      });
    }
  };

  const executeSaveStatus = async () => {
    try {
      setSaving(true);
      if (editingStatus) {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
      }
      const url = editingStatus
        ? `${API_URL}/webshop/admin/statuses/${editingStatus.id}`
        : `${API_URL}/webshop/admin/statuses`;
      const method = editingStatus ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusForm),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingStatus ? 'Status updated' : 'Status created');
        setIsStatusModalOpen(false);
        setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        fetchData();
      } else {
        toast.error(data.message || 'Operation failed');
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error saving status:', error);
      toast.error('Failed to save status');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAttachTemplate = (status, templateId) => {
    const templateName = templates.find((t) => t.id === parseInt(templateId))?.name || 'None';
    setConfirmModal({
      isOpen: true,
      title: 'Attach Email Template to Status',
      message: `Are you sure you want to attach "${templateName}" email template to "${status.name}" status? Customers will receive this email when their order changes to this status.`,
      type: 'primary',
      confirmText: 'Attach Email Template',
      loading: false,
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, loading: true }));
          const res = await fetch(`${API_URL}/webshop/admin/statuses/${status.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              webshopEmailTemplateId: templateId ? parseInt(templateId) : null,
            }),
          });
          const data = await res.json();
          if (data.success) {
            toast.success(`Attached email template to ${status.name}`);
            setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
            fetchData();
          } else {
            toast.error(data.message || 'Failed to attach template');
            setConfirmModal((prev) => ({ ...prev, loading: false }));
          }
        } catch (err) {
          console.error('Error attaching email template:', err);
          toast.error('Failed to attach template');
          setConfirmModal((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const handleRequestDeleteStatus = (status) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Order Status',
      message: `Are you sure you want to delete status "${status.name}"?`,
      type: 'danger',
      confirmText: 'Delete Status',
      loading: false,
      onConfirm: () => executeDeleteStatus(status.id),
    });
  };

  const executeDeleteStatus = async (id) => {
    try {
      setDeletingId(id);
      setConfirmModal((prev) => ({ ...prev, loading: true }));
      const res = await fetch(`${API_URL}/webshop/admin/statuses/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Status deleted');
        setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        fetchData();
      } else {
        toast.error(data.message || 'Delete failed');
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error deleting status:', error);
      toast.error('Failed to delete status');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        loading={confirmModal.loading}
      />

      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#1e3a8a]" /> Webshop Order Statuses ({statuses.length})
          </h2>
          <p className="text-xs text-slate-500">Manage custom order statuses and attach email triggers. Drag & drop to reorder.</p>
        </div>

        <button
          onClick={handleOpenCreateStatusModal}
          className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors bg-[#1e3a8a] hover:bg-blue-900"
        >
          <Plus className="h-4 w-4" /> ADD NEW STATUS
        </button>
      </div>

      {/* Statuses List Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
            <span>Loading order statuses...</span>
          </div>
        ) : statuses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">No order statuses configured.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4">Attached Email Template</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {statuses.map((status, index) => (
                  <tr
                    key={status.id}
                    draggable
                    onDragStart={(e) => handleStatusDragStart(e, index)}
                    onDragOver={(e) => handleStatusDragOver(e, index)}
                    onDragEnd={handleStatusDragEnd}
                    className={`hover:bg-slate-50/60 transition-colors cursor-move ${
                      draggedStatusIndex === index ? 'opacity-50 bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <GripVertical className="w-4 h-4 text-slate-400 shrink-0 cursor-grab active:cursor-grabbing" />
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: status.color || '#6366f1' }}
                        />
                        <span className="font-bold text-slate-900">{status.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {status.slug}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 max-w-sm">
                        <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <select
                          value={status.webshopEmailTemplateId || ''}
                          onChange={(e) => handleQuickAttachTemplate(status, e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#1e3a8a] outline-none cursor-pointer"
                        >
                          <option value="">-- No Email Attached --</option>
                          {templates.map((tpl) => (
                            <option key={tpl.id} value={tpl.id}>
                              📧 {tpl.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditStatusModal(status)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Status"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRequestDeleteStatus(status)}
                          disabled={deletingId === status.id}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
                          title="Delete Status"
                        >
                          {deletingId === status.id ? <RefreshCw className="w-4 h-4 animate-spin text-red-600" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT ORDER STATUS MODAL */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStatus ? 'Edit Order Status' : 'Add New Order Status'}
              </h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestSaveStatus} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Status Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Processing, Shipped"
                  value={statusForm.name}
                  onChange={(e) => setStatusForm({ ...statusForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Badge Color (Hex)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={statusForm.color}
                    onChange={(e) => setStatusForm({ ...statusForm, color: e.target.value })}
                    className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={statusForm.color}
                    onChange={(e) => setStatusForm({ ...statusForm, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Attach Email Template
                </label>
                <select
                  value={statusForm.webshopEmailTemplateId || ''}
                  onChange={(e) => setStatusForm({ ...statusForm, webshopEmailTemplateId: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                >
                  <option value="">-- No Email Attached --</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      📧 {tpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#1e3a8a] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingStatus ? 'Update Status' : 'Create Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebshopOrderStatusesPage;
