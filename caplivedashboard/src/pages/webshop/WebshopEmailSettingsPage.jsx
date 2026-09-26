import React, { useState, useEffect } from 'react';
import { Mail, Plus, Edit2, Trash2, RefreshCw, Info, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';
import ConfirmModal from '../../components/common/ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const WebshopEmailSettingsPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Drag & drop state
  const [draggedTemplateIndex, setDraggedTemplateIndex] = useState(null);

  // Modal states
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    isActive: true,
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

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/webshop/admin/email-templates`);
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching email templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Drag and drop reordering
  const handleTemplateDragStart = (e, index) => {
    setDraggedTemplateIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTemplateDragOver = (e, index) => {
    e.preventDefault();
    if (draggedTemplateIndex === null || draggedTemplateIndex === index) return;
    const updated = [...templates];
    const item = updated[draggedTemplateIndex];
    updated.splice(draggedTemplateIndex, 1);
    updated.splice(index, 0, item);
    setDraggedTemplateIndex(index);
    setTemplates(updated);
  };

  const handleTemplateDragEnd = async () => {
    setDraggedTemplateIndex(null);
    try {
      const items = templates.map((t, idx) => ({ id: t.id, sortOrder: idx + 1 }));
      const res = await fetch(`${API_URL}/webshop/admin/email-templates/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Email templates reordered & saved');
      } else {
        toast.error(data.message || 'Failed to save order');
      }
    } catch (error) {
      console.error('Error saving reordered templates:', error);
      toast.error('Failed to persist order to backend');
    }
  };

  const handleOpenCreateTemplateModal = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      subject: '',
      body: '<h2>Hello {customer_name},</h2><p>Your order {order_number} total is {order_total}. Status: {order_status}</p>',
      isActive: true,
    });
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplateModal = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name || '',
      subject: template.subject || '',
      body: template.body || '',
      isActive: template.isActive !== undefined ? template.isActive : true,
    });
    setIsTemplateModalOpen(true);
  };

  const handleRequestSaveTemplate = (e) => {
    e.preventDefault();
    if (!templateForm.name || !templateForm.subject) {
      toast.error('Template Name and Subject are required');
      return;
    }

    const isEdit = Boolean(editingTemplate);
    if (!isEdit) {
      executeSaveTemplate();
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Update Email Template',
        message: `Are you sure you want to update "${templateForm.name}"?`,
        type: 'primary',
        confirmText: 'Save Template',
        loading: false,
        onConfirm: executeSaveTemplate,
      });
    }
  };

  const executeSaveTemplate = async () => {
    try {
      setSaving(true);
      if (editingTemplate) {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
      }
      const url = editingTemplate
        ? `${API_URL}/webshop/admin/email-templates/${editingTemplate.id}`
        : `${API_URL}/webshop/admin/email-templates`;
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingTemplate ? 'Email template updated' : 'Email template created');
        setIsTemplateModalOpen(false);
        setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        fetchTemplates();
      } else {
        toast.error(data.message || 'Operation failed');
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDeleteTemplate = (template) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Email Template',
      message: `Are you sure you want to delete template "${template.name}"? Any order status attached to this template will no longer send this email.`,
      type: 'danger',
      confirmText: 'Delete Template',
      loading: false,
      onConfirm: () => executeDeleteTemplate(template.id),
    });
  };

  const executeDeleteTemplate = async (id) => {
    try {
      setDeletingId(id);
      setConfirmModal((prev) => ({ ...prev, loading: true }));
      const res = await fetch(`${API_URL}/webshop/admin/email-templates/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Email template deleted');
        setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        fetchTemplates();
      } else {
        toast.error(data.message || 'Delete failed');
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
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
            <Mail className="w-5 h-5 text-[#1e3a8a]" /> Webshop Email Templates ({templates.length})
          </h2>
          <p className="text-xs text-slate-500">Manage rich text email templates sent to customers. Drag & drop to reorder.</p>
        </div>

        <button
          onClick={handleOpenCreateTemplateModal}
          className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors bg-[#1e3a8a] hover:bg-blue-900"
        >
          <Plus className="h-4 w-4" /> ADD EMAIL TEMPLATE
        </button>
      </div>

      {/* Dynamic Variables Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded p-4 mb-6 shadow-sm">
        <h4 className="flex items-center gap-2 text-xs font-bold text-blue-800 mb-2 uppercase tracking-wider">
          <Info className="w-4 h-4" /> Available Dynamic Email Tags
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-blue-900">
          <div className="bg-white/70 px-2.5 py-1.5 rounded border border-blue-100 font-bold">{`{customer_name}`}</div>
          <div className="bg-white/70 px-2.5 py-1.5 rounded border border-blue-100 font-bold">{`{order_number}`}</div>
          <div className="bg-white/70 px-2.5 py-1.5 rounded border border-blue-100 font-bold">{`{order_status}`}</div>
          <div className="bg-white/70 px-2.5 py-1.5 rounded border border-blue-100 font-bold">{`{order_total}`}</div>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
            <span>Loading templates...</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">No email templates found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {templates.map((tpl, index) => (
              <div
                key={tpl.id}
                draggable
                onDragStart={(e) => handleTemplateDragStart(e, index)}
                onDragOver={(e) => handleTemplateDragOver(e, index)}
                onDragEnd={handleTemplateDragEnd}
                className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors cursor-move ${
                  draggedTemplateIndex === index ? 'opacity-50 bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-slate-400 shrink-0 cursor-grab active:cursor-grabbing" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 text-base">{tpl.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${tpl.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {tpl.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Subject: <span className="text-slate-800 font-medium">{tpl.subject}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditTemplateModal(tpl)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Template
                  </button>
                  <button
                    onClick={() => handleRequestDeleteTemplate(tpl)}
                    disabled={deletingId === tpl.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === tpl.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTemplate ? 'Edit Email Template' : 'Add New Email Template'}
              </h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestSaveTemplate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Order Shipped Email"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Email Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Your order {order_number} has been shipped!"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Email Body (Rich Text)
                  </label>
                  <RichTextEditor
                    value={templateForm.body}
                    onChange={(html) => setTemplateForm({ ...templateForm, body: html })}
                    placeholder="Compose email template message..."
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tplActive"
                    checked={templateForm.isActive}
                    onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#1e3a8a] rounded cursor-pointer"
                  />
                  <label htmlFor="tplActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Template Active
                  </label>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#1e3a8a] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebshopEmailSettingsPage;
