import React, { useState, useEffect } from 'react';
import {
  getProductionBatches, generateProductionBatch, sendProductionBatch,
  getDispatchLogs, getSettings, updateSetting, getProductionBatch, getEmailTemplates
} from '../services/admin.service';
import { Loader2, Send, FileSpreadsheet, Archive, CheckCircle2, Factory, Mail, Layers, Settings, X, List, Download } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const ProductionPage = () => {
  const [batches, setBatches] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [emailForm, setEmailForm] = useState({ recipientEmail: '', emailSubject: '', emailBody: '' });
  const [sending, setSending] = useState(false);
  const [manufacturerEmail, setManufacturerEmail] = useState('');
  const [autoExportDays, setAutoExportDays] = useState('0');
  const [savingSettings, setSavingSettings] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [ordersModal, setOrdersModal] = useState({ isOpen: false, loading: false, orders: [] });
  const [templates, setTemplates] = useState([]);
  const [sendExcel, setSendExcel] = useState(true);
  const [sendZip, setSendZip] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [b, l, settings, tpls] = await Promise.all([getProductionBatches(), getDispatchLogs(), getSettings(), getEmailTemplates()]);
      setBatches(b);
      setLogs(l);
      setTemplates(tpls);
      const mfg = settings.find(s => s.key === 'manufacturer_email');
      if (mfg?.value?.email) setManufacturerEmail(mfg.value.email);
      const autoExport = settings.find(s => s.key === 'auto_export_days');
      if (autoExport?.value?.days !== undefined) setAutoExportDays(autoExport.value.days.toString());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const result = await generateProductionBatch();
      if (result && result.id) {
        setSelectedBatch(result);
        setEmailForm({
          recipientEmail: result.recipientEmail || manufacturerEmail || '',
          emailSubject: result.emailSubject || '',
          emailBody: result.emailBody || '',
        });
        toast.success(`Successfully generated batch with ${result.orderCount} order(s)`);
      } else {
        toast.error(result?.message || 'No orders ready for production');
      }
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to generate batch'); }
    finally { setGenerating(false); }
  };

  const handleSelectBatch = (batch) => {
    setSelectedBatch(batch);
    setEmailForm({
      recipientEmail: batch.recipientEmail || manufacturerEmail || '',
      emailSubject: '',
      emailBody: '',
    });
    setSendExcel(true);
    setSendZip(true);
  };

  const handleSendClick = () => {
    if (!selectedBatch) return;
    setConfirmModal({ isOpen: true });
  };

  const handleViewOrders = async () => {
    if (!selectedBatch) return;
    setOrdersModal({ isOpen: true, loading: true, orders: [] });
    try {
      const fullBatch = await getProductionBatch(selectedBatch.id);
      setOrdersModal({ isOpen: true, loading: false, orders: fullBatch.orders || [] });
    } catch (e) {
      toast.error('Failed to load orders for this batch');
      setOrdersModal({ isOpen: false, loading: false, orders: [] });
    }
  };

  const executeSend = async () => {
    if (!selectedBatch) return;
    setSending(true);
    try {
      await sendProductionBatch(selectedBatch.id, { ...emailForm, sendExcel, sendZip });
      toast.success('Production files successfully dispatched to manufacturer!');
      setSelectedBatch(null);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to send email'); }
    finally { 
      setSending(false);
      setConfirmModal({ isOpen: false });
    }
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setEmailForm({
        ...emailForm,
        emailSubject: template.subject || emailForm.emailSubject,
        emailBody: template.body || emailForm.emailBody
      });
    }
  };

  const handleSaveManufacturerEmail = async () => {
    setSavingSettings(true);
    try {
      await updateSetting('manufacturer_email', { email: manufacturerEmail });
      await updateSetting('auto_export_days', { days: parseInt(autoExportDays) || 0 });
      toast.success('Production settings saved');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const getBaseUrl = () => {
    if (window.location.hostname === 'localhost') return 'http://localhost:3000';
    return 'https://capdevapi.studentlife.dk';
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Production Export</h2>
          <p className="text-sm text-slate-500">Compile orders and dispatch to manufacturer</p>
        </div>
        <button 
          onClick={handleGenerate} 
          disabled={generating}
          className="flex items-center gap-2 text-white text-xs font-bold px-5 py-2.5 rounded shadow-sm transition-colors bg-[#7cb342] hover:bg-[#689f38]"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
          GENERATE NEW BATCH
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Column */}
        <div className="xl:w-[400px] shrink-0 space-y-6">
          
          {/* Settings */}
          <div className="bg-white p-5 rounded border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center border-b border-slate-100 pb-2">
              <Settings className="h-4 w-4 mr-2 text-slate-400" /> Export & Dispatch Settings
            </h3>
            
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Default Factory Email</label>
              <input
                type="email"
                value={manufacturerEmail}
                onChange={e => setManufacturerEmail(e.target.value)}
                placeholder="factory@manufacturer.com"
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Auto-Export Frequency (Days)</label>
              <input
                type="number"
                min="0"
                value={autoExportDays}
                onChange={e => setAutoExportDays(e.target.value)}
                placeholder="e.g. 14 (0 to disable)"
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2">
              <button 
                onClick={handleSaveManufacturerEmail} 
                disabled={savingSettings}
                className="w-full bg-[#1e3a8a] text-white text-xs font-bold px-4 py-2.5 rounded shadow-sm hover:bg-blue-800 transition-colors flex items-center justify-center shrink-0"
              >
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : 'SAVE SETTINGS'}
              </button>
            </div>
          </div>

          {/* Batches */}
          <div className="bg-white rounded border border-slate-200 overflow-hidden flex flex-col h-[500px]">
            <div className="bg-[#fafafa] border-b border-slate-200 p-4">
               <h3 className="text-sm font-bold text-slate-700 flex items-center">
                 <Archive className="h-4 w-4 mr-2 text-slate-400" /> Batch Archives
               </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
              ) : batches.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                  <Archive className="h-10 w-10 mb-3 opacity-20" />
                  <p className="font-bold text-sm text-slate-500">No batches</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {batches.map(b => (
                    <button
                      key={b.id}
                      onClick={() => handleSelectBatch(b)}
                      className={cn(
                        "w-full text-left p-4 transition-colors border-l-4",
                        selectedBatch?.id === b.id 
                          ? "bg-blue-50/50 border-blue-500" 
                          : "border-transparent hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={cn("font-bold text-sm", selectedBatch?.id === b.id ? "text-blue-900" : "text-slate-800")}>
                            Batch #{b.id}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(b.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", b.status === 'SENT' ? 'bg-[#f0f8f1] text-[#2d6a4f]' : 'bg-amber-50 text-amber-700')}>
                            {b.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{b.orderCount} order{b.orderCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Review & Send */}
        <div className="flex-1">
          <div className="bg-white rounded border border-slate-200 h-[620px] flex flex-col">
            <div className="bg-[#fafafa] border-b border-slate-200 p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 flex items-center">
                <Send className="h-4 w-4 mr-2 text-slate-400" /> Review & Dispatch
              </h3>
              {selectedBatch && (
                <div className="flex items-center gap-3">
                  <button onClick={handleViewOrders} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-2 py-1 rounded transition-colors">
                    <List className="w-3 h-3 mr-1" /> View Orders
                  </button>
                  <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                    Batch #{selectedBatch.id}
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-6 flex-1 bg-[#f0f4f8]">
              {!selectedBatch ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                  <Mail className="h-12 w-12 mb-4 opacity-20" />
                  <p className="font-bold text-slate-600">No Batch Selected</p>
                  <p className="text-sm mt-1">Select a batch from the left to view details.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Visual Assets Preview */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 mb-3 flex items-center justify-between">
                      Generated Payload
                      <span className="text-[10px] text-slate-400 font-normal">Select attachments to include</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedBatch.excelFilePath ? (
                        <div className={cn("flex items-center justify-between p-3 border rounded transition-colors cursor-pointer", sendExcel ? "bg-white border-green-500" : "bg-slate-50 border-slate-200 opacity-70")} onClick={() => setSendExcel(!sendExcel)}>
                          <div className="flex items-center">
                            <FileSpreadsheet className={cn("h-8 w-8 mr-3 shrink-0", sendExcel ? "text-green-600" : "text-slate-400")} />
                            <div>
                              <p className="font-bold text-slate-700 text-xs">Manifest.xlsx</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Order Data</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <a href={`${getBaseUrl()}${selectedBatch.excelFilePath}`} target="_blank" rel="noreferrer" download onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-green-600 transition-colors p-1" title="Download Excel">
                              <Download className="h-4 w-4" />
                            </a>
                            <input type="checkbox" checked={sendExcel} onChange={() => {}} className="h-4 w-4 rounded border-slate-300 text-green-600" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center p-3 bg-slate-50 border border-slate-200 rounded opacity-60">
                          <FileSpreadsheet className="h-8 w-8 text-slate-400 mr-3" />
                          <span className="font-bold text-slate-500 text-xs">No Excel Generated</span>
                        </div>
                      )}
                      
                      {selectedBatch.zipFilePath ? (
                        <div className={cn("flex items-center justify-between p-3 border rounded transition-colors cursor-pointer", sendZip ? "bg-white border-blue-500" : "bg-slate-50 border-slate-200 opacity-70")} onClick={() => setSendZip(!sendZip)}>
                          <div className="flex items-center">
                            <Archive className={cn("h-8 w-8 mr-3 shrink-0", sendZip ? "text-blue-600" : "text-slate-400")} />
                            <div>
                              <p className="font-bold text-slate-700 text-xs">Production_PDFs.zip</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">4-View Designs</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <a href={`${getBaseUrl()}${selectedBatch.zipFilePath}`} target="_blank" rel="noreferrer" download onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Download ZIP">
                              <Download className="h-4 w-4" />
                            </a>
                            <input type="checkbox" checked={sendZip} onChange={() => {}} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                          </div>
                        </div>
                      ) : (
                         <div className="flex items-center p-3 bg-slate-50 border border-slate-200 rounded opacity-60">
                          <Archive className="h-8 w-8 text-slate-400 mr-3" />
                          <span className="font-bold text-slate-500 text-xs">No ZIP Generated</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email Composer */}
                  <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                    <div className="bg-[#fafafa] border-b border-slate-200 px-4 py-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Dispatcher</span>
                      <select 
                        onChange={handleTemplateChange}
                        className="text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none font-medium text-slate-700"
                      >
                        <option value="">-- Load Email Template --</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name || t.key}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div className="flex items-center border-b border-slate-100 pb-2">
                        <span className="w-16 text-xs font-bold text-slate-500">To:</span>
                        <input 
                          type="text"
                          value={emailForm.recipientEmail} 
                          onChange={e => setEmailForm({ ...emailForm, recipientEmail: e.target.value })} 
                          className="flex-1 outline-none text-sm font-medium text-slate-700 bg-transparent" 
                          disabled={selectedBatch.status === 'SENT'} 
                        />
                      </div>
                      <div className="flex items-center border-b border-slate-100 pb-2">
                        <span className="w-16 text-xs font-bold text-slate-500">Subject:</span>
                        <input 
                          type="text"
                          value={emailForm.emailSubject} 
                          onChange={e => setEmailForm({ ...emailForm, emailSubject: e.target.value })} 
                          className="flex-1 outline-none text-sm font-bold text-slate-800 bg-transparent" 
                          disabled={selectedBatch.status === 'SENT'} 
                        />
                      </div>
                      <div className="pt-2">
                        <textarea
                          value={emailForm.emailBody}
                          onChange={e => setEmailForm({ ...emailForm, emailBody: e.target.value })}
                          className="w-full resize-none outline-none text-sm text-slate-600 min-h-[160px] bg-transparent"
                          disabled={selectedBatch.status === 'SENT'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div>
                    {selectedBatch.status !== 'SENT' ? (
                      <div className="space-y-2">
                        <button 
                          onClick={handleSendClick} 
                          disabled={sending || !emailForm.recipientEmail || !emailForm.emailSubject || !emailForm.emailBody} 
                          className={cn("w-full text-white font-bold py-3.5 rounded shadow-sm transition-colors flex justify-center items-center text-sm",
                            (sending || !emailForm.recipientEmail || !emailForm.emailSubject || !emailForm.emailBody) 
                              ? "bg-slate-300 cursor-not-allowed text-slate-500" 
                              : "bg-[#1e3a8a] hover:bg-blue-800"
                          )}
                        >
                          {sending ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          ) : (
                            <Send className="h-5 w-5 mr-2" />
                          )}
                          {sending ? 'DISPATCHING...' : 'SEND TO MANUFACTURER'}
                        </button>
                        {(!emailForm.emailSubject || !emailForm.emailBody) && (
                          <p className="text-center text-[10px] text-red-500 font-medium bg-red-50 py-1 rounded">
                            You must load an Email Template or enter a Subject and Body to dispatch.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[#2d6a4f] bg-[#f0f8f1] border border-green-200 rounded p-4 justify-center font-bold text-sm">
                        <CheckCircle2 className="h-5 w-5" /> BATCH SUCCESSFULLY DISPATCHED
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Dispatch Production Files"
        message="Are you sure you want to dispatch these production files? An email will be sent to the manufacturer with the generated Excel manifest and Zip archive."
        confirmText="Dispatch Files"
        isLoading={sending}
        onConfirm={executeSend}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />

      {/* Orders List Modal */}
      {ordersModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Batch #{selectedBatch?.id} Orders</h3>
              <button onClick={() => setOrdersModal({ isOpen: false, loading: false, orders: [] })} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-slate-50 custom-scrollbar">
              {ordersModal.loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
              ) : ordersModal.orders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-medium text-sm">No orders found in this batch.</div>
              ) : (
                <div className="space-y-3">
                  {ordersModal.orders.map(o => {
                    const details = typeof o.customerDetails === 'string' ? JSON.parse(o.customerDetails) : (o.customerDetails || {});
                    const custName = o.customer ? `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim() : null;
                    const detailsName = `${details.firstName || ''} ${details.lastName || ''}`.trim();
                    const finalName = custName || detailsName || o.customerName || 'Unknown Customer';
                    return (
                      <div key={o.id} className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center shadow-sm gap-2">
                        <div>
                          <p className="font-bold text-sm text-slate-800">Order #{o.orderNumber || o.id}</p>
                          <p className="text-xs font-medium text-slate-500 mt-1">{finalName} <span className="opacity-50">|</span> {o.customerEmail}</p>
                        </div>
                        <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-bold tracking-wider">{o.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionPage;
