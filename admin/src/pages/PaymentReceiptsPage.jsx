import React, { useState, useEffect } from 'react';
import {
  Receipt, Search, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  Eye, Send, Loader2, Filter, Settings, Mail, Clock, ShieldAlert,
  ArrowRight, ExternalLink, X, RotateCcw
} from 'lucide-react';
import {
  getPaymentReceipts,
  resendPaymentReceipt,
  getPaymentReceiptSettings,
  updatePaymentReceiptSettings,
  getPaymentReceiptPreviewHtml
} from '../services/admin.service';
import { Button, Input } from '../components/ui';
import toast from 'react-hot-toast';

const PaymentReceiptsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, retrying: 0, pending: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [settings, setSettings] = useState({ recipientEmail: 'salg@studentlife.dk', enabled: true });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [orderType, setOrderType] = useState('');

  // Modals
  const [resendModal, setResendModal] = useState({ isOpen: false, log: null, customEmail: '' });
  const [resendLoading, setResendLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, log: null, html: '', loading: false });
  const [errorModal, setErrorModal] = useState({ isOpen: false, log: null });

  const handleOpenPreview = async (log) => {
    setPreviewModal({ isOpen: true, log, html: '', loading: true });
    try {
      const html = await getPaymentReceiptPreviewHtml(log.id);
      setPreviewModal({ isOpen: true, log, html, loading: false });
    } catch (err) {
      console.error('Failed to load preview:', err);
      toast.error('Failed to load receipt preview');
      setPreviewModal({ isOpen: false, log: null, html: '', loading: false });
    }
  };

  // Load Settings
  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const data = await getPaymentReceiptSettings();
      if (data) {
        setSettings({
          recipientEmail: data.recipientEmail || 'salg@studentlife.dk',
          enabled: data.enabled !== false
        });
      }
    } catch (err) {
      console.warn('Could not load payment receipt settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    if (!settings.recipientEmail || !settings.recipientEmail.trim()) {
      return toast.error('Please enter a valid administrator email address');
    }

    setSavingSettings(true);
    try {
      await updatePaymentReceiptSettings(settings);
      toast.success('Payment receipt notification settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Load Receipt Logs
  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await getPaymentReceipts({
        page,
        limit,
        search: search.trim() || undefined,
        status: status || undefined,
        orderType: orderType || undefined
      });
      setLogs(res.data || []);
      setTotal(res.total || 0);
      setStats(res.stats || { total: 0, sent: 0, failed: 0, retrying: 0, pending: 0 });
    } catch (err) {
      toast.error('Failed to load payment receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [page, status, orderType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const handleOpenResend = (log) => {
    setResendModal({
      isOpen: true,
      log,
      customEmail: log.recipientEmail || settings.recipientEmail || 'salg@studentlife.dk'
    });
  };

  const handleConfirmResend = async (e) => {
    e.preventDefault();
    if (!resendModal.log) return;

    setResendLoading(true);
    try {
      await resendPaymentReceipt(resendModal.log.id, resendModal.customEmail.trim() || null);
      toast.success(`Receipt re-sent to ${resendModal.customEmail || resendModal.log.recipientEmail}`);
      setResendModal({ isOpen: false, log: null, customEmail: '' });
      loadLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to re-send receipt email');
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusBadge = (logStatus, retryCount) => {
    switch (logStatus) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Sent
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Failed
          </span>
        );
      case 'RETRYING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Retrying ({retryCount || 1}/3)
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            Disabled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            Pending
          </span>
        );
    }
  };

  const getOrderTypeBadge = (type) => {
    switch (type) {
      case 'INSTALLMENT':
        return <span className="px-2 py-0.5 text-xs rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">Installment</span>;
      case 'WEBSHOP':
        return <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">Webshop</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">Cap Order</span>;
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-indigo-600" />
            Payment Receipts & Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automatic Frisbii payment confirmation receipts sent to the administrator.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { loadLogs(); loadSettings(); }}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Admin Notification Settings Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-all">
        <form onSubmit={handleSaveSettings} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Administrator Notification Email</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every successful Frisbii transaction automatically dispatches a branded receipt to this email.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Status:</label>
              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-xs text-slate-600 font-medium">
                {settings.enabled ? 'Active' : 'Paused'}
              </span>
            </div>

            <div className="relative min-w-[260px]">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={settings.recipientEmail}
                onChange={(e) => setSettings(s => ({ ...s, recipientEmail: e.target.value }))}
                placeholder="admin@studentlife.dk"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            <Button
              type="submit"
              disabled={savingSettings || settingsLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>

      {/* Metrics / Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Receipts</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total || 0}</div>
          <div className="text-xs text-slate-400 mt-1">All recorded transactions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Successfully Sent</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.sent || 0}</div>
          <div className="text-xs text-emerald-600/80 mt-1">Delivered to administrator</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">Retrying / Pending</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{(stats.retrying || 0) + (stats.pending || 0)}</div>
          <div className="text-xs text-amber-600/80 mt-1">Scheduled for auto-retry</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-rose-600 uppercase tracking-wider">Failed Delivery</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{stats.failed || 0}</div>
          <div className="text-xs text-rose-600/80 mt-1">Manual resend available</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order #, Frisbii Receipt #, Customer Name, or Email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="RETRYING">Retrying</option>
              <option value="PENDING">Pending</option>
            </select>

            <select
              value={orderType}
              onChange={(e) => { setOrderType(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Types</option>
              <option value="CAP_ORDER">Cap Orders</option>
              <option value="INSTALLMENT">Installments</option>
              <option value="WEBSHOP">Webshop</option>
            </select>

            <Button type="submit" variant="secondary" className="px-4">
              Filter
            </Button>

            {(search || status || orderType) && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setSearch(''); setStatus(''); setOrderType(''); setPage(1); }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Order / Type</th>
                <th className="py-3.5 px-4">Receipt Ref (Frisbii)</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Admin Recipient</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading payment receipt logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No payment receipts found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                      <div>{new Date(log.paymentDate || log.createdAt).toLocaleDateString('da-DK')}</div>
                      <div className="text-[11px] text-slate-400">{new Date(log.paymentDate || log.createdAt).toLocaleTimeString('da-DK')}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{log.orderNumber}</div>
                      <div className="mt-0.5">{getOrderTypeBadge(log.orderType)}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-xs font-mono text-slate-700 font-medium">
                        {log.receiptNumber || log.transactionId || '-'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{log.customerName || 'Customer'}</div>
                      <div className="text-xs text-slate-500">{log.customerEmail || '-'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-semibold text-slate-900">
                      {log.amount.toFixed(2)} {log.currency || 'DKK'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        💳 {log.paymentMethod || 'Frisbii Payment'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(log.status, log.retryCount)}
                        {log.status === 'FAILED' && log.error && (
                          <button
                            type="button"
                            onClick={() => setErrorModal({ isOpen: true, log })}
                            className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 mt-0.5 font-medium"
                          >
                            <AlertCircle className="w-3 h-3" /> View Error
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                      <div className="font-medium text-slate-700">{log.recipientEmail}</div>
                      {log.sentAt && (
                        <div className="text-[11px] text-emerald-600">
                          Sent: {new Date(log.sentAt).toLocaleTimeString('da-DK')}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenPreview(log)}
                          title="Preview Branded Receipt Email"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenResend(log)}
                          title="Resend Receipt Email"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > limit && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600 bg-slate-50/50">
            <div>
              Showing page <span className="font-semibold text-slate-900">{page}</span> of <span className="font-semibold text-slate-900">{totalPages}</span> ({total} receipts)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Resend Modal */}
      {resendModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Resend Payment Receipt</h3>
                  <p className="text-xs text-slate-500">Order #{resendModal.log?.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setResendModal({ isOpen: false, log: null, customEmail: '' })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResend} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <strong className="text-slate-900">{resendModal.log?.amount?.toFixed(2)} {resendModal.log?.currency}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Receipt Ref:</span>
                  <span className="font-mono text-slate-700">{resendModal.log?.receiptNumber || resendModal.log?.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Date:</span>
                  <span>{new Date(resendModal.log?.paymentDate || resendModal.log?.createdAt).toLocaleString('da-DK')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Recipient Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={resendModal.customEmail}
                    onChange={(e) => setResendModal(m => ({ ...m, customEmail: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="salg@studentlife.dk"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  You can edit this address to deliver the receipt to an alternate email if needed.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResendModal({ isOpen: false, log: null, customEmail: '' })}
                  disabled={resendLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resendLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                >
                  {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Receipt Now
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/75">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Payment Receipt Preview — {previewModal.log?.orderNumber}
                  </h3>
                  {previewModal.log && (
                    <p className="text-[11px] text-slate-500">
                      To: <span className="font-medium text-slate-700">{previewModal.log.recipientEmail}</span>
                      {previewModal.log.sentAt && (
                        <span> • Sent: {new Date(previewModal.log.sentAt).toLocaleDateString('da-DK')} {new Date(previewModal.log.sentAt).toLocaleTimeString('da-DK')}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!previewModal.html) return;
                    const w = window.open('', '_blank');
                    if (w) {
                      w.document.open();
                      w.document.write(previewModal.html);
                      w.document.close();
                    }
                  }}
                  disabled={previewModal.loading || !previewModal.html}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium cursor-pointer disabled:opacity-50 mr-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                </button>
                <button
                  onClick={() => setPreviewModal({ isOpen: false, log: null, html: '', loading: false })}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-4 overflow-auto flex justify-center items-center">
              {previewModal.loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                  <span className="text-xs font-medium">Henter receipt preview...</span>
                </div>
              ) : (
                <iframe
                  title="Payment Receipt Preview"
                  srcDoc={previewModal.html}
                  className="w-full max-w-[620px] h-full bg-white rounded-lg shadow-sm border border-slate-200"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Details Modal */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Delivery Failure Log</h3>
                  <p className="text-xs text-slate-500">Order #{errorModal.log?.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setErrorModal({ isOpen: false, log: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Error Details
                </label>
                <pre className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-lg text-xs font-mono text-rose-800 whitespace-pre-wrap break-words leading-relaxed max-h-48 overflow-y-auto">
                  {errorModal.log?.error || 'No additional error details recorded.'}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-slate-400">Retry Attempts</div>
                  <div className="font-bold text-slate-900 mt-0.5">{errorModal.log?.retryCount || 0} of {errorModal.log?.maxRetries || 3}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-slate-400">Last Attempted</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {errorModal.log?.lastAttemptAt ? new Date(errorModal.log.lastAttemptAt).toLocaleTimeString('da-DK') : 'Never'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setErrorModal({ isOpen: false, log: null })}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const l = errorModal.log;
                    setErrorModal({ isOpen: false, log: null });
                    handleOpenResend(l);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" /> Try Resend Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentReceiptsPage;

