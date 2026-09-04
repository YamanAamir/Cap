import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmailTemplates, updateEmailTemplate, createEmailTemplate, deleteEmailTemplate } from '../services/admin.service';
import { Loader2, Save, Mail, Plus, Trash2, X, Info, AlertTriangle, ExternalLink, Lock } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const EmailTemplatesPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [edited, setEdited] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', body: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, template: null });
  const [inUseModal, setInUseModal] = useState({ isOpen: false, template: null });

  const load = () => {
    setLoading(true);
    getEmailTemplates()
      .then(t => {
        setTemplates(t);
        const map = {};
        t.forEach(tpl => { map[tpl.key] = { name: tpl.name || '', subject: tpl.subject, body: tpl.body }; });
        setEdited(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (key) => {
    setSaving(key);
    try {
      await updateEmailTemplate(key, edited[key]);
      toast.success('Template saved!');
      load();
    } catch (e) {
      const errorMsg = e.response?.data?.message || 'Save failed';
      toast.error(errorMsg);
    } finally {
      setSaving(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving('new');
    try {
      await createEmailTemplate(form);
      setForm({ name: '', subject: '', body: '' });
      setShowForm(false);
      toast.success('Template created!');
      load();
    } catch (e) {
      const errorMsg = e.response?.data?.message || 'Creation failed';
      toast.error(errorMsg);
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteClick = (tpl) => {
    if (tpl.statuses && tpl.statuses.length > 0) {
      setInUseModal({ isOpen: true, template: tpl });
    } else {
      setConfirmModal({ isOpen: true, template: tpl });
    }
  };

  const executeDelete = async () => {
    if (!confirmModal.template) return;
    setIsDeleting(true);
    try {
      await deleteEmailTemplate(confirmModal.template.id);
      toast.success(`Template "${confirmModal.template.name || confirmModal.template.key}" deleted!`);
      setConfirmModal({ isOpen: false, template: null });
      load();
    } catch (e) {
      const errorMsg = e.response?.data?.message || 'Deletion failed';
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const isSystemTemplate = (key) => ['customer_confirmation', 'manufacturer_production'].includes(key);

  const labels = {
    customer_confirmation: 'Customer Order Confirmation',
    manufacturer_production: 'Manufacturer Production Email',
  };

  if (loading && !templates.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[900px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Email Templates</h2>
          <p className="text-sm text-slate-500">Edit email content for customers and manufacturer</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className={cn(
            "flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors",
            showForm ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-[#1e3a8a] text-white hover:bg-blue-800"
          )}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} 
          {showForm ? 'CANCEL' : 'ADD NEW TEMPLATE'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded p-4 mb-6 shadow-sm">
         <h4 className="flex items-center gap-2 text-sm font-bold text-blue-800 mb-2 uppercase tracking-wider">
           <Info className="w-4 h-4" /> Global Available Variables
         </h4>
         <p className="text-sm text-blue-700 mb-3 leading-relaxed">
           You can use dynamic variables in the Subject and Body of your emails. Wrap them in double curly braces, like <code className="bg-white px-1 py-0.5 rounded text-blue-900 font-mono font-bold">{'{{variableName}}'}</code>.
         </p>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm font-mono text-blue-800 bg-white/60 p-3 rounded border border-blue-100">
           <div>{`{{orderNumber}}`} <span className="text-blue-500 font-sans block text-xs mt-0.5">e.g. CAP-12345</span></div>
           <div>{`{{customerName}}`} <span className="text-blue-500 font-sans block text-xs mt-0.5">e.g. John Doe</span></div>
           <div>{`{{totalPrice}}`} <span className="text-blue-500 font-sans block text-xs mt-0.5">e.g. 1500.00</span></div>
           <div>{`{{currency}}`} <span className="text-blue-500 font-sans block text-xs mt-0.5">e.g. DKK</span></div>
           <div>{`{{orderCount}}`} <span className="text-blue-500 font-sans block text-xs mt-0.5">For batches</span></div>
         </div>
         <p className="text-sm text-blue-600 mt-3 italic font-medium">
           Example: "Hi {'{{customerName}}'}, your order #{'{{orderNumber}}'} has been processed!"
         </p>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-white border border-slate-200 rounded animate-in slide-in-from-top-2 fade-in duration-300 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Create New Template</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Template Name</label>
              <input 
                type="text" 
                placeholder="e.g. Quality Check Failed"
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-700" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Subject</label>
              <input 
                type="text" 
                value={form.subject} 
                onChange={e => setForm({ ...form, subject: e.target.value })} 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-700" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Body</label>
              <textarea 
                value={form.body} 
                onChange={e => setForm({ ...form, body: e.target.value })} 
                required 
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-500 min-h-[120px] resize-y font-mono"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={saving === 'new'}
              className="mt-2 bg-[#7cb342] text-white text-xs font-bold px-6 py-3 rounded shadow-sm hover:bg-[#689f38] transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {saving === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              SAVE TEMPLATE
            </button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {templates.map(tpl => {
          const isSystem = isSystemTemplate(tpl.key);
          const attachedStatuses = tpl.statuses || [];
          const isInUse = attachedStatuses.length > 0;

          return (
            <div key={tpl.key} className="bg-white border border-slate-200 rounded overflow-hidden">
              <div className="px-5 py-3.5 bg-[#fafafa] border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <p className="font-bold text-slate-700 text-sm">
                    {isSystem ? labels[tpl.key] : tpl.name || tpl.key}
                  </p>
                  {isSystem && (
                    <span className="bg-slate-200 text-slate-700 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> System Core
                    </span>
                  )}
                  {isInUse ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {attachedStatuses.map(st => (
                        <span 
                          key={st.id} 
                          className="text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 shadow-xs"
                          style={{ 
                            backgroundColor: (st.color || '#6366f1') + '15', 
                            color: st.color || '#6366f1',
                            borderColor: (st.color || '#6366f1') + '40'
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color || '#6366f1' }} />
                          Used in: {st.name}
                        </span>
                      ))}
                    </div>
                  ) : !isSystem ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      Unassigned
                    </span>
                  ) : null}
                </div>
                <button 
                  onClick={() => handleDeleteClick(tpl)} 
                  className="p-1.5 px-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-1.5 text-xs font-semibold"
                  title={isInUse ? "Template is currently in use" : "Delete Template"}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-red-600">Delete</span>
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                {!isSystem && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Template Name</label>
                    <input
                      type="text"
                      value={edited[tpl.key]?.name || ''}
                      onChange={e => setEdited({ ...edited, [tpl.key]: { ...edited[tpl.key], name: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-800"
                    />
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Subject</label>
                  <input
                    type="text"
                    value={edited[tpl.key]?.subject || ''}
                    onChange={e => setEdited({ ...edited, [tpl.key]: { ...edited[tpl.key], subject: e.target.value } })}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Body</label>
                  <textarea
                    value={edited[tpl.key]?.body || ''}
                    onChange={e => setEdited({ ...edited, [tpl.key]: { ...edited[tpl.key], body: e.target.value } })}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-500 min-h-[160px] resize-y font-mono"
                  />
                </div>

                <button 
                  onClick={() => handleSave(tpl.key)} 
                  disabled={saving === tpl.key} 
                  className={cn(
                    "flex items-center gap-2 text-white text-xs font-bold px-5 py-2.5 rounded shadow-sm transition-colors",
                    saving === tpl.key ? "bg-slate-400 cursor-not-allowed" : "bg-[#1e3a8a] hover:bg-blue-800"
                  )}
                >
                  {saving === tpl.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  SAVE CHANGES
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal for Unassigned Templates */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={isSystemTemplate(confirmModal.template?.key) ? "Delete System Core Template" : "Delete Email Template"}
        message={
          isSystemTemplate(confirmModal.template?.key)
            ? `Are you sure you want to delete the system core template "${labels[confirmModal.template?.key] || confirmModal.template?.name || confirmModal.template?.key}"? If removed, default fallback content will be used.`
            : `Are you sure you want to delete "${confirmModal.template?.name || confirmModal.template?.key}"? This action cannot be undone.`
        }
        confirmText="Delete Template"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, template: null })}
      />

      {/* Warning Modal when Template is currently attached to Order Status(es) */}
      {inUseModal.isOpen && inUseModal.template && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-amber-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100 bg-amber-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Cannot Delete Email Template</h3>
                  <p className="text-xs text-amber-800 font-medium">Template is currently in use</p>
                </div>
              </div>
              <button 
                onClick={() => setInUseModal({ isOpen: false, template: null })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                The template <span className="font-bold text-slate-800">"{labels[inUseModal.template.key] || inUseModal.template.name || inUseModal.template.key}"</span> cannot be deleted because it is currently attached to the following <span className="font-bold text-slate-800">Order Status(es)</span>:
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Attached Statuses:</div>
                <div className="flex flex-wrap gap-2">
                  {inUseModal.template.statuses?.map(st => (
                    <div 
                      key={st.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold border shadow-xs"
                      style={{ 
                        backgroundColor: (st.color || '#6366f1') + '15', 
                        color: st.color || '#6366f1',
                        borderColor: (st.color || '#6366f1') + '40'
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color || '#6366f1' }} />
                      {st.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 leading-relaxed space-y-1">
                <span className="font-bold block text-amber-950">Required Action to Delete:</span>
                <p>
                  Please go to <strong>Order Statuses</strong>, edit or unassign this email template from the status(es) above, and then return here to delete it.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 bg-[#fafafa] border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setInUseModal({ isOpen: false, template: null })}
                className="px-4 py-2 rounded text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setInUseModal({ isOpen: false, template: null });
                  navigate('/dashboard/statuses');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-bold text-white bg-[#1e3a8a] hover:bg-blue-800 transition-colors shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Go to Order Statuses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplatesPage;

