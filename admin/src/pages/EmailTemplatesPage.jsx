import React, { useState, useEffect } from 'react';
import { getEmailTemplates, updateEmailTemplate, createEmailTemplate, deleteEmailTemplate } from '../services/admin.service';
import { Loader2, Save, Mail, Plus, Trash2, X, Info } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const EmailTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [edited, setEdited] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', body: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

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
    } catch (e) { toast.error('Save failed'); }
    finally { setSaving(null); }
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
      toast.error('Creation failed');
    } finally {
      setSaving(null);
    }
  };

  const executeDelete = async () => {
    if (!confirmModal.id) return;
    setIsDeleting(true);
    try {
      await deleteEmailTemplate(confirmModal.id);
      toast.success('Template deleted!');
      load();
    } catch (e) {
      toast.error('Deletion failed');
    } finally {
      setIsDeleting(false);
      setConfirmModal({ isOpen: false, id: null });
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
        {templates.map(tpl => (
          <div key={tpl.key} className="bg-white border border-slate-200 rounded overflow-hidden">
            <div className="px-5 py-3 bg-[#fafafa] border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <p className="font-bold text-slate-700 text-sm">
                  {isSystemTemplate(tpl.key) ? labels[tpl.key] : tpl.name || tpl.key}
                </p>
                {isSystemTemplate(tpl.key) && (
                  <span className="bg-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-2">System</span>
                )}
              </div>
              {!isSystemTemplate(tpl.key) && (
                 <button onClick={() => setConfirmModal({ isOpen: true, id: tpl.id })} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                   <Trash2 className="h-4 w-4" />
                 </button>
              )}
            </div>
            
            <div className="p-5 space-y-4">
              {!isSystemTemplate(tpl.key) && (
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
        ))}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Template"
        message="Are you sure you want to delete this template? Any Order Statuses linked to it will no longer send an email."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default EmailTemplatesPage;
