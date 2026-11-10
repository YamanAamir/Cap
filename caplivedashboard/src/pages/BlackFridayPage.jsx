import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  Users,
  MessageSquare,
  Mail,
  Calendar,
  Search,
  Filter,
  RefreshCcw,
  Download,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Flame,
  ChevronLeft,
  ChevronRight,
  Bell,
  Save,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getBlackFridayLeads,
  deleteBlackFridayLead,
  bulkDeleteBlackFridayLeads,
  broadcastBlackFridaySms,
  broadcastBlackFridayEmail,
  exportBlackFridayCsv,
  getBlackFridaySettings,
  updateBlackFridaySettings
} from '../services/admin.service';

export default function BlackFridayPage() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, smsSentTotal: 0, emailSentTotal: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 25, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);

  // Admin Notification Settings
  const [notifyEmail, setNotifyEmail] = useState('salg@studentlife.dk');
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [smsModal, setSmsModal] = useState({ isOpen: false, lead: null, isAll: false, message: '', isSending: false });
  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    lead: null,
    isAll: false,
    subject: 'Du er på VIP-listen! 🖤',
    headline: 'Bekræftelse efter tilmelding',
    bodyText: 'Du er på VIP-listen! 🖤\n\nDu er nu et skridt tættere på årets Black Week-tilbud hos Student Life!\n\nHold øje med din mail og SMS. Vi sender dig dit personlige VIP-link, så snart din eksklusive adgang åbner.\n\nVi ses til Black Week!',
    buttonText: 'BESØG STUDENT LIFE 🖤',
    buttonUrl: 'https://studentlife.dk',
    isSending: false
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, isBulk: false, isDeleting: false });
  const [copiedPhone, setCopiedPhone] = useState(null);

  const smsTextareaRef = useRef(null);
  const emailTextareaRef = useRef(null);

  const fetchSettings = async () => {
    try {
      const res = await getBlackFridaySettings();
      if (res && res.success && res.settings) {
        setNotifyEmail(res.settings.notifyEmail || 'salg@studentlife.dk');
        setNotifyEnabled(res.settings.notifyEnabled !== false);
      }
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (notifyEnabled && (!notifyEmail || !notifyEmail.includes('@'))) {
      return toast.error('Please enter a valid notification email address');
    }
    setSavingSettings(true);
    try {
      await updateBlackFridaySettings({ notifyEmail, notifyEnabled });
      toast.success('Notification settings saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save notification settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchLeads = async (page = pagination.page) => {
    setLoading(true);
    try {
      const data = await getBlackFridayLeads({
        page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      });
      if (data && data.success) {
        setLeads(data.leads || []);
        setStats(data.stats || { total: 0, today: 0, smsSentTotal: 0, emailSentTotal: 0 });
        setPagination(data.pagination || { page: 1, limit: 25, totalPages: 1, totalCount: 0 });
      }
    } catch (err) {
      console.error('Failed to load VIP leads:', err);
      toast.error('Failed to load VIP leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchLeads(1);
    setSelectedIds([]);
  }, [search, dateFrom, dateTo]);

  // Selection helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(leads.map(l => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
    toast.success('Phone copied to clipboard');
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      const blob = await exportBlackFridayCsv();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `studentlife_black_friday_vip_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('VIP Leads exported to CSV successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV');
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      if (deleteModal.isBulk) {
        const res = await bulkDeleteBlackFridayLeads(selectedIds);
        toast.success(res.message || `Deleted ${selectedIds.length} lead(s)`);
        setSelectedIds([]);
      } else {
        await deleteBlackFridayLead(deleteModal.id);
        toast.success('VIP Lead deleted successfully');
      }
      setDeleteModal({ isOpen: false, id: null, isBulk: false, isDeleting: false });
      fetchLeads(pagination.page);
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // SMS Broadcast
  const openSmsModal = (target = 'selected') => {
    let isAll = false;
    let targetLead = null;
    let defaultMsg = 'Hej {{name}}! 🖤 Du er nu på VIP-listen til Black Week hos Student Life. Hold øje med din SMS og mail for dit personlige VIP-link: https://studentlife.dk';

    if (typeof target === 'object' && target !== null) {
      targetLead = target;
    } else if (target === 'all') {
      isAll = true;
    }

    setSmsModal({
      isOpen: true,
      lead: targetLead,
      isAll,
      message: defaultMsg,
      isSending: false
    });
  };

  const insertSmsTag = (tag) => {
    const el = smsTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = smsModal.message;
    const newText = text.substring(0, start) + tag + text.substring(end);
    setSmsModal(prev => ({ ...prev, message: newText }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const handleSendSms = async () => {
    if (!smsModal.message.trim()) {
      return toast.error('Please enter SMS message text');
    }

    setSmsModal(prev => ({ ...prev, isSending: true }));
    try {
      let leadIds = [];
      if (smsModal.lead) {
        leadIds = [smsModal.lead.id];
      } else if (smsModal.isAll) {
        leadIds = 'all';
      } else {
        leadIds = selectedIds;
      }

      const res = await broadcastBlackFridaySms({
        leadIds,
        message: smsModal.message
      });

      if (res && res.success) {
        toast.success(`SMS broadcast complete! Sent: ${res.sentCount}, Failed: ${res.failedCount}`);
        setSmsModal({ isOpen: false, lead: null, isAll: false, message: '', isSending: false });
        fetchLeads(pagination.page);
      } else {
        toast.error(res?.error || 'SMS broadcast failed');
        setSmsModal(prev => ({ ...prev, isSending: false }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to send SMS');
      setSmsModal(prev => ({ ...prev, isSending: false }));
    }
  };

  // Email Broadcast Modal (PURE TEXT - NO HTML NEEDED, NO PREVIEW CARD)
  const openEmailModal = (target = 'selected') => {
    let isAll = false;
    let targetLead = null;

    if (typeof target === 'object' && target !== null) {
      targetLead = target;
    } else if (target === 'all') {
      isAll = true;
    }

    setEmailModal({
      isOpen: true,
      lead: targetLead,
      isAll,
      subject: 'Du er på VIP-listen! 🖤',
      headline: 'Bekræftelse efter tilmelding',
      bodyText: 'Du er på VIP-listen! 🖤\n\nDu er nu et skridt tættere på årets Black Week-tilbud hos Student Life!\n\nHold øje med din mail og SMS. Vi sender dig dit personlige VIP-link, så snart din eksklusive adgang åbner.\n\nVi ses til Black Week!',
      buttonText: 'BESØG STUDENT LIFE 🖤',
      buttonUrl: 'https://studentlife.dk',
      isSending: false
    });
  };

  const insertEmailTag = (tag) => {
    const el = emailTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = emailModal.bodyText;
    const newText = text.substring(0, start) + tag + text.substring(end);
    setEmailModal(prev => ({ ...prev, bodyText: newText }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const handleSendEmail = async () => {
    if (!emailModal.subject.trim()) {
      return toast.error('Please enter an email subject');
    }
    if (!emailModal.bodyText.trim()) {
      return toast.error('Please enter email message content');
    }

    setEmailModal(prev => ({ ...prev, isSending: true }));
    try {
      let leadIds = [];
      if (emailModal.lead) {
        leadIds = [emailModal.lead.id];
      } else if (emailModal.isAll) {
        leadIds = 'all';
      } else {
        leadIds = selectedIds;
      }

      const res = await broadcastBlackFridayEmail({
        leadIds,
        subject: emailModal.subject,
        headline: emailModal.headline,
        bodyText: emailModal.bodyText,
        buttonText: emailModal.buttonText,
        buttonUrl: emailModal.buttonUrl
      });

      if (res && res.success) {
        toast.success(`Email broadcast complete! Sent: ${res.sentCount}, Failed: ${res.failedCount}`);
        setEmailModal(prev => ({ ...prev, isOpen: false, isSending: false }));
        fetchLeads(pagination.page);
      } else {
        toast.error(res?.error || 'Email broadcast failed');
        setEmailModal(prev => ({ ...prev, isSending: false }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to send email broadcast');
      setEmailModal(prev => ({ ...prev, isSending: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#053638] text-amber-400 rounded-lg shadow-xs">
              <Flame className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Black Friday VIP Leads & Broadcast</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            VIP registrations from WordPress with multi-channel SMS and Email broadcast capabilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openSmsModal('all')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Broadcast SMS (All)
          </button>
          <button
            onClick={() => openEmailModal('all')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#053638] hover:bg-[#07474a] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Mail className="w-4 h-4" />
            Broadcast Email (All)
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => fetchLeads()}
            disabled={loading}
            className="p-2.5 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin text-indigo-600")} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total VIP Signups</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Registrations</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.today.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SMS Broadcasts Sent</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.smsSentTotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Emails Delivered</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.emailSentTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Admin Notification Settings Bar (100% English) */}
      <form onSubmit={handleSaveSettings} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Admin Email Notifications for New VIP Signups</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically receive an email notification whenever a customer signs up on the WordPress VIP form.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={notifyEnabled}
              onChange={(e) => setNotifyEnabled(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Enable notifications</span>
          </label>

          <input
            type="email"
            placeholder="e.g. salg@studentlife.dk"
            value={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.value)}
            disabled={!notifyEnabled}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 min-w-[200px]"
          />

          <button
            type="submit"
            disabled={savingSettings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Settings
          </button>
        </div>
      </form>

      {/* Filter and Bulk Action Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              title="From date"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              title="To date"
            />
            {(search || dateFrom || dateTo) && (
              <button
                onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Selected Banner */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs text-indigo-900 font-medium animate-fadeIn">
            <span>{selectedIds.length} lead(s) selected</span>
            <button
              onClick={() => openSmsModal('selected')}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <MessageSquare className="w-3 h-3" />
              SMS Selected
            </button>
            <button
              onClick={() => openEmailModal('selected')}
              className="px-2.5 py-1 bg-[#053638] hover:bg-[#07474a] text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Mail className="w-3 h-3" />
              Email Selected
            </button>
            <button
              onClick={() => setDeleteModal({ isOpen: true, id: null, isBulk: true, isDeleting: false })}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Trash2 className="w-3 h-3" />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={leads.length > 0 && selectedIds.length === leads.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Lead / Customer</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-center">SMS Sent</th>
                <th className="py-3 px-4 text-center">Email Sent</th>
                <th className="py-3 px-4">VIP Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    <span>Loading VIP Leads...</span>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No VIP Leads found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || dateFrom || dateTo
                        ? 'Try clearing your filters to see registered leads.'
                        : 'Signups submitted from the WordPress Black Week form will appear here automatically.'}
                    </p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);
                  const initial = (lead.name || 'U').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={lead.id}
                      className={cn(
                        "hover:bg-slate-50/60 transition-colors group",
                        isSelected && "bg-indigo-50/40"
                      )}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(lead.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#053638] text-amber-300 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {initial}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{lead.name}</p>
                            <p className="text-[11px] text-slate-400">WordPress VIP Registration</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-xs text-slate-700 hover:text-indigo-600 font-medium block truncate max-w-[220px]"
                          >
                            {lead.email}
                          </a>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span>{lead.phone}</span>
                            <button
                              onClick={() => handleCopyPhone(lead.phone)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                              title="Copy phone"
                            >
                              {copiedPhone === lead.phone ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(lead.createdAt).toLocaleString('da-DK', {
                          timeZone: 'Europe/Copenhagen',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                          lead.smsSentCount > 0 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"
                        )}>
                          {lead.smsSentCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                          lead.emailSentCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                        )}>
                          {lead.emailSentCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#053638] text-amber-300 border border-[#053638] shadow-xs">
                          <span>VIP MEMBER 🖤</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openSmsModal(lead)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Send SMS"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEmailModal(lead)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, id: lead.id, isBulk: false, isDeleting: false })}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} leads
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLeads(pagination.page - 1)}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold text-slate-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLeads(pagination.page + 1)}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          EMAIL BROADCAST MODAL (FOCUSED TEXT FORM - NO PREVIEW CARD)
      ───────────────────────────────────────────────────────────── */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#053638] text-amber-300 rounded-lg">
                  <Mail className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {emailModal.lead ? `Send VIP Email to ${emailModal.lead.name}` : emailModal.isAll ? 'Broadcast Email to ALL VIP Leads' : `Broadcast Email to ${selectedIds.length} Selected Leads`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {emailModal.lead ? emailModal.lead.email : emailModal.isAll ? `${stats.total} total registered recipients` : `${selectedIds.length} recipient(s)`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Focused Plain Text Email Form */}
            <div className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailModal.subject}
                  onChange={(e) => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. Du er på VIP-listen! 🖤"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#053638]/20 focus:border-[#053638]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Headline / Header Banner (Optional)
                </label>
                <input
                  type="text"
                  value={emailModal.headline}
                  onChange={(e) => setEmailModal(prev => ({ ...prev, headline: e.target.value }))}
                  placeholder="e.g. Bekræftelse efter tilmelding"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#053638]/20 focus:border-[#053638]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Message Body (Plain text only - NO HTML)
                  </label>
                  <button
                    type="button"
                    onClick={() => insertEmailTag('{{name}}')}
                    className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[11px] font-bold hover:bg-amber-100 transition-colors"
                    title="Insert recipient name dynamically"
                  >
                    + {'{{name}}'}
                  </button>
                </div>
                <textarea
                  ref={emailTextareaRef}
                  rows={8}
                  value={emailModal.bodyText}
                  onChange={(e) => setEmailModal(prev => ({ ...prev, bodyText: e.target.value }))}
                  placeholder="Type your plain text message here. Paragraphs and line breaks are formatted automatically..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#053638]/20 focus:border-[#053638] resize-none font-sans"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  You do not need to write HTML tags. Your plain text will be automatically formatted and sent in the official Student Life template.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Button Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={emailModal.buttonText}
                    onChange={(e) => setEmailModal(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="e.g. BESØG STUDENT LIFE 🖤"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#053638]/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Button URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={emailModal.buttonUrl}
                    onChange={(e) => setEmailModal(prev => ({ ...prev, buttonUrl: e.target.value }))}
                    placeholder="https://studentlife.dk"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#053638]/20 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={emailModal.isSending || !emailModal.subject.trim() || !emailModal.bodyText.trim()}
                onClick={handleSendEmail}
                className="px-5 py-2.5 bg-[#053638] hover:bg-[#07474a] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                {emailModal.isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Email Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SMS BROADCAST MODAL
      ───────────────────────────────────────────────────────────── */}
      {smsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {smsModal.lead ? `Send SMS to ${smsModal.lead.name}` : smsModal.isAll ? 'Broadcast SMS to ALL VIP Leads' : `Broadcast SMS to ${selectedIds.length} Selected Leads`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {smsModal.lead ? smsModal.lead.phone : smsModal.isAll ? `${stats.total} total recipients` : `${selectedIds.length} recipient(s)`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSmsModal({ isOpen: false, lead: null, isAll: false, message: '', isSending: false })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  SMS Message Text
                </label>
                <textarea
                  ref={smsTextareaRef}
                  rows={4}
                  value={smsModal.message}
                  onChange={(e) => setSmsModal(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Type your SMS message here..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              {/* Placeholders & Segment Counter */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Tags:</span>
                  <button
                    type="button"
                    onClick={() => insertSmsTag('{{name}}')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono text-[11px] font-semibold transition-colors"
                  >
                    + {'{{name}}'}
                  </button>
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  {smsModal.message.length} chars ({Math.ceil(smsModal.message.length / 160) || 1} SMS)
                </div>
              </div>

              {/* Message Live Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="font-bold text-slate-500 text-[10px] uppercase mb-1">Recipient Preview:</p>
                <p className="text-slate-700 italic">
                  {smsModal.message.replace(/\{\{name\}\}/gi, smsModal.lead ? smsModal.lead.name : 'Sarah Hansen')}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSmsModal({ isOpen: false, lead: null, isAll: false, message: '', isSending: false })}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={smsModal.isSending || !smsModal.message.trim()}
                onClick={handleSendSms}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                {smsModal.isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send SMS Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl w-fit mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {deleteModal.isBulk ? `Delete ${selectedIds.length} VIP Lead(s)?` : 'Delete VIP Lead?'}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              This action cannot be undone. The selected lead records will be permanently removed.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, id: null, isBulk: false, isDeleting: false })}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                {deleteModal.isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
