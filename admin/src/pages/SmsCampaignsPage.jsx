import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { getSmsCampaigns, createSmsCampaign, updateSmsCampaign, getSmsMessages, exportCampaignNonPurchasers } from '../services/admin.service';
import { Plus, Loader2, MessageSquare, Clock, Smartphone, ChevronDown, ChevronUp, Link as LinkIcon, Send, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_STEPS = [
  { dayOffset: 0, message: 'Hej {{name}}! Velkommen til StudentLife. Din rabatkode er {{discountCode}} - gyldig til {{expiryDate}}.' },
  { dayOffset: 5, message: 'Hej {{name}}! Husk din rabatkode {{discountCode}} til din studenterhue.' },
  { dayOffset: 15, message: 'Hej {{name}}! Din rabat {{discountCode}} udløber snart - {{expiryDate}}.' },
  { dayOffset: 20, message: 'Sidste chance {{name}}! Brug {{discountCode}} inden den udløber.' },
];

const SmsCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showQrModal, setShowQrModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([getSmsCampaigns(), getSmsMessages()]);
      setCampaigns(c);
      setMessages(m);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleCampaign = async (id, isActive) => {
    await updateSmsCampaign(id, { isActive: !isActive });
    load();
  };

  const handleExport = async (e, campaignId) => {
    e.stopPropagation();
    try {
      const blob = await exportCampaignNonPurchasers(campaignId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `campaign_${campaignId}_non_purchasers.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to export non-purchasers');
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createSmsCampaign({ name: newName.trim(), steps: DEFAULT_STEPS });
      setNewName('');
      setShowCreate(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const updateStep = async (campaign, stepIndex, field, value) => {
    const steps = campaign.steps.map((s, i) => i === stepIndex ? { ...s, [field]: value } : s);
    await updateSmsCampaign(campaign.id, { steps });
    load(); // Refresh data to reflect changes
  };

  if (loading && !campaigns.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">SMS Operations</h2>
          <p className="text-sm text-slate-500">Design and automate SMS marketing pipelines</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)} 
          className={cn(
            "flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors",
            showCreate ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-[#7cb342] text-white hover:bg-[#689f38]"
          )}
        >
          <Plus className={cn("h-4 w-4", showCreate && "rotate-45")} /> 
          {showCreate ? 'CANCEL' : 'NEW CAMPAIGN'}
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 p-6 bg-white border border-slate-200 rounded animate-in slide-in-from-top-2 fade-in duration-300">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Initialize Campaign Workflow</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="e.g. Summer Discount Series" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <button 
              onClick={handleCreate} 
              disabled={creating || !newName.trim()} 
              className="bg-[#1e3a8a] text-white text-xs font-bold px-6 py-2 rounded shadow-sm hover:bg-blue-800 transition-colors w-full sm:w-auto flex items-center justify-center shrink-0"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'LAUNCH'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Campaigns List */}
        <div className="lg:col-span-2 space-y-4">
          {campaigns.length === 0 && !loading && (
            <div className="p-12 text-center border border-dashed border-slate-300 rounded bg-[#fafafa]">
              <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-600">No active pipelines</h3>
              <p className="text-xs text-slate-500 mt-1">Create an SMS campaign to engage customers.</p>
            </div>
          )}

          {campaigns.map(campaign => (
            <div 
              key={campaign.id} 
              className="bg-white border border-slate-200 rounded overflow-hidden"
            >
              <div 
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer transition-colors hover:bg-slate-50",
                  expanded === campaign.id && "bg-[#fafafa]"
                )}
                onClick={() => setExpanded(expanded === campaign.id ? null : campaign.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded", campaign.isActive ? "bg-[#f0f8f1] text-[#2d6a4f]" : "bg-slate-100 text-slate-400")}>
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{campaign.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase", campaign.isActive ? "bg-[#e8f5e9] text-[#2e7d32]" : "bg-slate-100 text-slate-500")}>
                        {campaign.isActive ? 'Active Pipeline' : 'Paused'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" /> {campaign._count?.enrollments ?? 0}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Send className="h-3 w-3" /> {campaign.steps?.length ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mt-3 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={(e) => handleExport(e, campaign.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    <Download className="h-3 w-3" /> Export
                  </button>
                  <label className="flex items-center cursor-pointer relative">
                     <input 
                       type="checkbox" 
                       checked={campaign.isActive} 
                       onChange={() => toggleCampaign(campaign.id, campaign.isActive)} 
                       className="sr-only"
                     />
                     <div className={cn("w-10 h-5 bg-slate-200 rounded-full transition-colors", campaign.isActive && "bg-green-500")}>
                        <div className={cn("w-3.5 h-3.5 bg-white rounded-full mt-[3px] ml-[3px] transition-transform", campaign.isActive && "transform translate-x-5")}></div>
                     </div>
                  </label>
                  
                  <button className="text-slate-400 hover:text-slate-600">
                    {expanded === campaign.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Timeline UI for expanded state */}
              {expanded === campaign.id && (
                <div className="p-6 bg-[#fafafa] border-t border-slate-200">
                  <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 p-3 bg-white border border-slate-200 rounded flex items-start gap-2">
                      <CodeIcon className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Available Variables</p>
                        <p className="font-mono text-slate-700 text-xs">{'{{name}} {{discountCode}} {{expiryDate}}'}</p>
                      </div>
                    </div>
                      <div className="p-3 bg-white border border-slate-200 rounded flex items-center gap-4 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setShowQrModal(campaign.id)}>
                        <div className="bg-white p-1 border border-slate-200 rounded shrink-0">
                          <QRCodeSVG 
                            value={`${import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173'}/sms-signup?campaignId=${campaign.id}`}
                            size={64}
                            level="M"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                            Campaign QR Code
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Click to view or download specific campaign QR code.</p>
                        </div>
                      </div>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[11px] before:w-0.5 before:bg-slate-200">
                    {campaign.steps?.map((step, i) => (
                      <div key={step.id || i} className="relative">
                        {/* Timeline Node */}
                        <div className="absolute -left-6 mt-2 h-6 w-6 rounded-full border-2 border-[#fafafa] bg-slate-300 flex items-center justify-center z-10">
                          <Clock className="h-3 w-3 text-white" />
                        </div>
                        
                        <div className="bg-white p-4 rounded border border-slate-200 ml-4 shadow-sm relative">
                          <div className="flex flex-col md:flex-row gap-4">
                            
                            <div className="md:w-[120px] shrink-0">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                Dispatch Day
                              </label>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-500 text-sm">Day</span>
                                <input 
                                  type="number" 
                                  value={step.dayOffset} 
                                  onChange={e => updateStep(campaign, i, 'dayOffset', parseInt(e.target.value) || 0)} 
                                  className="w-16 px-2 py-1 text-center font-bold text-slate-700 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" 
                                />
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                SMS Content
                              </label>
                              <textarea
                                value={step.message}
                                onChange={e => updateStep(campaign, i, 'message', e.target.value)}
                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500 min-h-[80px] resize-y"
                              />
                              <div className="flex justify-end mt-1">
                                <span className="text-[10px] font-bold text-slate-400">
                                  {step.message.length} chars ({Math.ceil(step.message.length / 160)} SMS)
                               </span>
                              </div>
                            </div>
                            
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          
          <div className="bg-[#1e3a8a] text-white p-6 rounded border border-blue-900 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="h-4 w-4 text-blue-300" />
                <h3 className="font-bold text-sm">Opt-in Portal</h3>
              </div>
              <p className="text-xs text-blue-100 mb-4">
                Deploy this URL across marketing channels.
              </p>
              <div className="bg-black/20 p-3 rounded border border-white/10 cursor-pointer hover:bg-black/30 transition-colors" onClick={() => {
                const url = `${import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173'}/sms-signup${expanded ? `?campaignId=${expanded}` : ''}`;
                navigator.clipboard.writeText(url);
                toast.success("URL copied to clipboard!", { style: { background: '#333', color: '#fff', fontSize: '12px' } });
              }}>
                <code className="block text-xs font-mono text-green-300 break-all">
                  {`${import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173'}/sms-signup${expanded ? `?campaignId=${expanded}` : ''}`}
                </code>
                <p className="text-[10px] font-bold uppercase text-white/50 mt-1 flex justify-end">
                  Click to Copy
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded flex flex-col h-[400px]">
            <div className="px-4 py-3 border-b border-slate-200 bg-[#fafafa] flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <Send className="h-4 w-4 text-green-600" /> Dispatch Log
              </h3>
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded">{messages.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <Clock className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-xs font-bold">No dispatches logged yet.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.slice(0, 30).map(msg => (
                    <div key={msg.id} className="p-3 rounded hover:bg-slate-50 transition-colors flex flex-col gap-1.5 border-b border-slate-100 last:border-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 truncate">{msg.customer?.name || 'Unknown'} <span className="text-slate-400 font-medium ml-1">{msg.phone}</span></p>
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0",
                          msg.status === 'SENT' ? 'bg-green-100 text-green-700' :
                          msg.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                          msg.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                        )}>
                          {msg.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{msg.message}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-1">
                        <Clock className="w-3 h-3" />
                        {msg.status === 'SENT' && msg.sentAt ? 
                          `Sent on ${new Date(msg.sentAt).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' })}` : 
                          `Scheduled for ${new Date(msg.scheduledFor).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' })}`
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowQrModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowQrModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">Campaign QR Code</h3>
            <p className="text-sm text-slate-500 mb-6 text-center">Scan this code with a camera to join the campaign.</p>
            
            <div className="p-4 bg-white border-2 border-slate-200 rounded-xl">
              <QRCodeSVG 
                value={`${import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173'}/sms-signup?campaignId=${showQrModal}`}
                size={220}
                level="M"
              />
            </div>
            
            <button 
              className="mt-8 w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-bold text-sm tracking-wide hover:bg-blue-900 transition-colors"
              onClick={() => setShowQrModal(null)}
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Extracted small icons for inline usage to keep imports clean
const UsersIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const CodeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

export default SmsCampaignsPage;
