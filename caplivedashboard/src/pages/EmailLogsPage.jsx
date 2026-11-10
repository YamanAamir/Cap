import React, { useState, useEffect } from 'react';
import {
  Mail, Search, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  Eye, Send, Loader2, ArrowRight, Paperclip, Filter, CheckSquare, Square
} from 'lucide-react';
import { getEmailLogs, getEmailLog, resendEmail, resendEmailsBulk } from '../services/admin.service';
import { Button } from '../components/ui';
import toast from 'react-hot-toast';

const EmailLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ sent: 0, failed: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkSending, setBulkSending] = useState(false);

  // View modal
  const [viewLog, setViewLog] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Single resend modal
  const [resendModal, setResendModal] = useState({ isOpen: false, log: null, customTo: '' });
  const [resendLoading, setResendLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await getEmailLogs({
        page,
        limit,
        search: search.trim() || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setLogs(res.data || []);
      setTotal(res.total || 0);
      setStats(res.stats || { sent: 0, failed: 0 });
      setSelectedIds([]);
    } catch (e) {
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, status, from, to]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const handleView = async (id) => {
    setViewLoading(true);
    setViewLog(null);
    try {
      const data = await getEmailLog(id);
      setViewLog(data);
    } catch (e) {
      toast.error('Failed to load email preview');
    } finally {
      setViewLoading(false);
    }
  };

  const handleSingleResend = async (e) => {
    e.preventDefault();
    setResendLoading(true);
    try {
      await resendEmail(resendModal.log.id, resendModal.customTo || null);
      toast.success(`Email re-sent to ${resendModal.customTo || resendModal.log.toEmail}`);
      setResendModal({ isOpen: false, log: null, customTo: '' });
      loadLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Re-send failed');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBulkResend = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Are you sure you want to re-send ${selectedIds.length} selected email(s)?`)) return;

    setBulkSending(true);
    try {
      const res = await resendEmailsBulk(selectedIds);
      toast.success(res.message || 'Bulk re-send complete');
      loadLogs();
    } catch (err) {
      toast.error('Bulk re-send failed');
    } finally {
      setBulkSending(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === logs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map((l) => l.id));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Mail className="w-7 h-7 text-blue-600" />
            Email Sending Logs & Delivery
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track every outgoing email (order confirmations, installment payment links, factory tickets) with full content preview and one-click resend.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Total Sent / Logged</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{total}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Successfully Delivered</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.sent}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Failed Delivery</p>
            <p className="text-2xl font-bold text-red-600 mt-0.5">{stats.failed}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search recipient, subject, order # (e.g. CAP-1794240)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 bg-white font-medium"
            >
              <option value="">All Statuses</option>
              <option value="SENT">Delivered (Sent)</option>
              <option value="FAILED">Failed</option>
            </select>

            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-700 bg-white"
              title="From date"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-700 bg-white"
              title="To date"
            />

            <Button type="submit" className="bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold px-4 py-2">
              Filter
            </Button>
          </div>
        </form>

        {/* Bulk Action Strip */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 animate-in fade-in">
            <span className="font-semibold">{selectedIds.length} email(s) selected</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBulkResend}
                disabled={bulkSending}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 flex items-center gap-1.5"
              >
                {bulkSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Resend Selected ({selectedIds.length})
              </Button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fafafa] text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-8">
                  <button onClick={toggleSelectAll} className="text-slate-500">
                    {selectedIds.length > 0 && selectedIds.length === logs.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Recipient (To)</th>
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3">Order #</th>
                <th className="py-3 px-3">Sent At</th>
                <th className="py-3 px-3">Resends</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading email logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No email logs found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSelected = selectedIds.includes(log.id);
                  const isSent = log.status === 'SENT';
                  return (
                    <tr key={log.id} className={`hover:bg-slate-50/70 transition ${isSelected ? 'bg-blue-50/40' : ''}`}>
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(log.id)}
                          className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] ${
                            isSent
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isSent ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {log.status}
                        </span>
                        {log.error && (
                          <span className="block text-[10px] text-red-500 truncate max-w-[150px] mt-0.5" title={log.error}>
                            {log.error}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {log.toEmail}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-[280px] truncate" title={log.subject}>
                        {log.subject || '(no subject)'}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-600">
                        {log.orderNumber ? (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{log.orderNumber}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {log.resentCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            {log.resentCount}x
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleView(log.id)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded mr-1"
                          title="View email preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setResendModal({ isOpen: true, log, customTo: log.toEmail })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded"
                          title="Resend email"
                        >
                          <Send className="w-3 h-3" /> Resend
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <span>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total emails)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODAL: VIEW EMAIL PREVIEW ─── */}
      {(viewLog || viewLoading) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {viewLoading ? 'Loading Email...' : viewLog?.subject || '(No Subject)'}
                </h3>
                {viewLog && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    To: <strong>{viewLog.toEmail}</strong> • Sent: {new Date(viewLog.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewLog(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {viewLoading ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                </div>
              ) : (
                <>
                  {viewLog.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <strong>Delivery Error:</strong> {viewLog.error}
                    </div>
                  )}

                  {viewLog.attachments && viewLog.attachments.length > 0 && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-700">Attachments:</span>
                      <span className="text-slate-600">
                        {viewLog.attachments.map((a) => a.filename || 'attachment').join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-inner">
                    {viewLog.html ? (
                      <iframe
                        title="Email Preview"
                        srcDoc={viewLog.html}
                        className="w-full min-h-[450px] border-none"
                        sandbox="allow-same-origin"
                      />
                    ) : (
                      <pre className="p-4 font-mono text-xs text-slate-700 whitespace-pre-wrap">
                        {viewLog.textBody || '(Empty email body)'}
                      </pre>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              {viewLog && (
                <Button
                  onClick={() => {
                    const l = viewLog;
                    setViewLog(null);
                    setResendModal({ isOpen: true, log: l, customTo: l.toEmail });
                  }}
                  className="bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Resend This Email
                </Button>
              )}
              <button
                onClick={() => setViewLog(null)}
                className="px-4 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: RESEND EMAIL ─── */}
      {resendModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSingleResend} className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" /> Resend Email
            </h3>
            <p className="text-xs text-slate-500">
              You are about to re-send this email with its exact original template, options, and attachments.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Subject</label>
              <div className="p-2 bg-slate-100 rounded text-xs text-slate-700 font-medium">
                {resendModal.log?.subject}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Recipient Email <span className="text-slate-400 font-normal">(change if needed)</span>
              </label>
              <input
                type="email"
                value={resendModal.customTo}
                onChange={(e) => setResendModal({ ...resendModal, customTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs font-medium focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResendModal({ isOpen: false, log: null, customTo: '' })}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={resendLoading || !resendModal.customTo}
                className="bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5"
              >
                {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Confirm & Send
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmailLogsPage;

