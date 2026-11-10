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
  Eye,
  Loader2,
  Sparkles,
  Flame,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getBlackFridayLeads,
  deleteBlackFridayLead,
  bulkDeleteBlackFridayLeads,
  broadcastBlackFridaySms,
  broadcastBlackFridayEmail,
  exportBlackFridayCsv
} from '../services/admin.service';

export default function BlackFridayPage() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, smsSentTotal: 0, emailSentTotal: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 25, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [smsModal, setSmsModal] = useState({ isOpen: false, lead: null, isAll: false, message: '', isSending: false });
  const [emailModal, setEmailModal] = useState({ isOpen: false, lead: null, isAll: false, subject: '', html: '', isSending: false, previewMode: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, isBulk: false, isDeleting: false });
  const [copiedPhone, setCopiedPhone] = useState(null);

  const smsTextareaRef = useRef(null);
  const emailTextareaRef = useRef(null);

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
      console.error('Failed to load Black Friday VIP leads:', err);
      toast.error('Failed to load VIP leads list');
    } finally {
      setLoading(false);
    }
  };

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
        toast.success('Lead deleted successfully');
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
    let defaultMsg = 'Hej {{name}}! 🖤 Black Week er i gang hos Student Life! Få din VIP-rabat på din studenterhue her: https://studentlife.dk';

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
        toast.success(`SMS Broadcast complete! Sent: ${res.sentCount}, Failed: ${res.failedCount}`);
        setSmsModal({ isOpen: false, lead: null, isAll: false, message: '', isSending: false });
        fetchLeads(pagination.page);
      } else {
        toast.error(res?.error || 'Broadcast failed');
        setSmsModal(prev => ({ ...prev, isSending: false }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to send SMS broadcast');
      setSmsModal(prev => ({ ...prev, isSending: false }));
    }
  };

  // Email Broadcast
  const openEmailModal = (target = 'selected') => {
    let isAll = false;
    let targetLead = null;
    let defaultSubject = '🖤 Hej {{name}} – Din VIP-adgang til Black Week er klar!';
    let defaultHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #172225; line-height: 1.6;">
  <div style="background-color: #053638; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">BLACK WEEK ER I GANG! 🖤</h1>
    <p style="color: #e8b52f; font-weight: bold; margin: 10px 0 0 0;">Eksklusiv VIP-adgang til Student Life</p>
  </div>
  <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Kære {{name}},</p>
    <p>Som tilmeldt vores VIP-liste er du blandt de allerførste, der får adgang til årets største tilbud på studenterhuer og tilbehør!</p>
    <p>Gå ind på vores webshop nu og spar stort inden tilbuddene åbner for alle andre.</p>
    <div style="text-align: center; margin: 35px 0;">
      <a href="https://studentlife.dk" style="background-color: #053638; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">FÅ DIT VIP-TILBUD HER 🖤</a>
    </div>
    <p style="font-size: 13px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
      Venlig hilsen,<br><strong>Student Life Teamet</strong>
    </p>
  </div>
</div>`;

    if (typeof target === 'object' && target !== null) {
      targetLead = target;
    } else if (target === 'all') {
      isAll = true;
    }

    setEmailModal({
      isOpen: true,
      lead: targetLead,
      isAll,
      subject: defaultSubject,
      html: defaultHtml,
      isSending: false,
      previewMode: false
    });
  };

  const insertEmailTag = (tag) => {
    const el = emailTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = emailModal.html;
    const newText = text.substring(0, start) + tag + text.substring(end);
    setEmailModal(prev => ({ ...prev, html: newText }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const handleSendEmail = async () => {
    if (!emailModal.subject.trim()) {
      return toast.error('Please enter email subject');
    }
    if (!emailModal.html.trim()) {
      return toast.error('Please enter email HTML body');
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
        html: emailModal.html
      });

      if (res && res.success) {
        toast.success(`Email Broadcast complete! Sent: ${res.sentCount}, Failed: ${res.failedCount}`);
        setEmailModal({ isOpen: false, lead: null, isAll: false, subject: '', html: '', isSending: false, previewMode: false });
        fetchLeads(pagination.page);
      } else {
        toast.error(res?.error || 'Broadcast failed');
        setEmailModal(prev => ({ ...prev, isSending: false }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to send Email broadcast');
      setEmailModal(prev => ({ ...prev, isSending: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-amber-400 rounded-lg">
              <Flame className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Black Friday VIP Leads & Broadcast</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Registered VIP users from WordPress form with multi-channel SMS and Email broadcast capabilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openSmsModal('all')}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Broadcast SMS (All)
          </button>
          <button
            onClick={() => openEmailModal('all')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#053638] hover:bg-[#07474a] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Mail className="w-4 h-4" />
            Broadcast Email (All)
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => fetchLeads()}
            disabled={loading}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
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
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Registered At</th>
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
                        : 'Signups submitted from the WordPress Black Week page will appear here instantly.'}
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
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {initial}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{lead.name}</p>
                            {lead.school ? (
                              <p className="text-xs text-slate-400">{lead.school}</p>
                            ) : (
                              <p className="text-[11px] text-slate-400">WordPress VIP Embed</p>
                            )}
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
                              title="Copy Phone"
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-amber-300 border border-slate-700 shadow-xs">
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
          SMS BROADCAST MODAL
      ───────────────────────────────────────────────────────────── */}
      {smsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-fadeIn">
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
                    {smsModal.lead ? smsModal.lead.phone : smsModal.isAll ? `${stats.total} total registered recipients` : `${selectedIds.length} recipient(s)`}
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Message Text
                </label>
                <textarea
                  ref={smsTextareaRef}
                  rows={4}
                  value={smsModal.message}
                  onChange={(e) => setSmsModal(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Skriv din besked her..."
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
                <p className="font-semibold text-slate-500 text-[10px] uppercase mb-1">Live Recipient Preview:</p>
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
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                {smsModal.isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Broadcast Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EMAIL BROADCAST MODAL
      ───────────────────────────────────────────────────────────── */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Mail className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {emailModal.lead ? `Send Email to ${emailModal.lead.name}` : emailModal.isAll ? 'Broadcast Email to ALL VIP Leads' : `Broadcast Email to ${selectedIds.length} Selected Leads`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {emailModal.lead ? emailModal.lead.email : emailModal.isAll ? `${stats.total} total registered recipients` : `${selectedIds.length} recipient(s)`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailModal({ isOpen: false, lead: null, isAll: false, subject: '', html: '', isSending: false, previewMode: false })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailModal.subject}
                  onChange={(e) => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Indtast emne..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Mode Toggle: HTML Editor vs Preview */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Insert tag:</span>
                  <button
                    type="button"
                    onClick={() => insertEmailTag('{{name}}')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono text-[11px] font-semibold transition-colors"
                  >
                    + {'{{name}}'}
                  </button>
                </div>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setEmailModal(prev => ({ ...prev, previewMode: false }))}
                    className={cn(
                      "px-3 py-1 rounded-md transition-colors",
                      !emailModal.previewMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    HTML Source
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailModal(prev => ({ ...prev, previewMode: true }))}
                    className={cn(
                      "px-3 py-1 rounded-md transition-colors flex items-center gap-1",
                      emailModal.previewMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                </div>
              </div>

              {!emailModal.previewMode ? (
                <div>
                  <textarea
                    ref={emailTextareaRef}
                    rows={10}
                    value={emailModal.html}
                    onChange={(e) => setEmailModal(prev => ({ ...prev, html: e.target.value }))}
                    placeholder="HTML / Email content..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  />
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 min-h-[220px] max-h-[350px] overflow-y-auto">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: emailModal.html.replace(/\{\{name\}\}/gi, emailModal.lead ? emailModal.lead.name : 'Sarah Hansen')
                    }}
                  />
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setEmailModal({ isOpen: false, lead: null, isAll: false, subject: '', html: '', isSending: false, previewMode: false })}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={emailModal.isSending || !emailModal.subject.trim() || !emailModal.html.trim()}
                onClick={handleSendEmail}
                className="px-5 py-2 bg-[#053638] hover:bg-[#07474a] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                {emailModal.isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Email Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 animate-fadeIn">
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

