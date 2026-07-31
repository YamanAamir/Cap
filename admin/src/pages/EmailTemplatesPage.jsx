import React, { useState, useEffect } from 'react';
import { getEmailTemplates, updateEmailTemplate } from '../services/admin.service';
import { Loader2, Save, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const EmailTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [edited, setEdited] = useState({});

  useEffect(() => {
    getEmailTemplates()
      .then(t => {
        setTemplates(t);
        const map = {};
        t.forEach(tpl => { map[tpl.key] = { subject: tpl.subject, body: tpl.body }; });
        setEdited(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key) => {
    setSaving(key);
    try {
      await updateEmailTemplate(key, edited[key]);
      alert('Template saved!');
    } catch (e) { alert('Save failed'); }
    finally { setSaving(null); }
  };

  const labels = {
    customer_confirmation: 'Customer Order Confirmation',
    manufacturer_production: 'Manufacturer Production Email',
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[900px] mx-auto pb-12">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Email Templates</h2>
        <p className="text-sm text-slate-500">Edit email content for customers and manufacturer</p>
      </div>

      <div className="space-y-6">
        {templates.map(tpl => (
          <div key={tpl.key} className="bg-white border border-slate-200 rounded overflow-hidden">
            <div className="px-5 py-3 bg-[#fafafa] border-b border-slate-200 flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <p className="font-bold text-slate-700 text-sm">{labels[tpl.key] || tpl.key}</p>
            </div>
            
            <div className="p-5 space-y-4">
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
              <p className="text-xs text-slate-400 font-mono">Available variables: {'{{orderNumber}} {{customerName}} {{totalPrice}} {{currency}} {{orderCount}}'}</p>
              <button 
                onClick={() => handleSave(tpl.key)} 
                disabled={saving === tpl.key} 
                className={cn(
                  "flex items-center gap-2 text-white text-xs font-bold px-5 py-2.5 rounded shadow-sm transition-colors",
                  saving === tpl.key ? "bg-slate-400 cursor-not-allowed" : "bg-[#1e3a8a] hover:bg-blue-800"
                )}
              >
                {saving === tpl.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                SAVE TEMPLATE
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailTemplatesPage;
