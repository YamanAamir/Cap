import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Search, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  Eye, Copy, Check, Filter, Activity
} from 'lucide-react';
import { getAuditLogs } from '../services/admin.service';
import { Button } from '../components/ui';
import toast from 'react-hot-toast';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // View modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({
        page,
        limit,
        search: search.trim() || undefined,
        action: action || undefined,
        entity: entity || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, action, entity]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const formatDetails = (details) => {
    if (!details) return '';
    if (typeof details === 'object') {
      try {
        return JSON.stringify(details, null, 2);
      } catch (e) {
        return String(details);
      }
    }
    try {
      const parsed = JSON.parse(details);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return details;
    }
  };

  const parseAuditAction = (log) => {
    if (!log) return { type: 'ACTION', badgeClass: 'bg-gray-100 text-gray-800 border-gray-200', title: 'System Action', entityName: 'System', subtitle: '' };

    const rawAction = (log.action || '').trim();
    const rawEntity = (log.entity || '').trim().toLowerCase();
    const rawMethod = (log.method || (rawAction.match(/^(GET|POST|PUT|PATCH|DELETE)/i)?.[0]) || '').toUpperCase();
    const rawPath = (log.path || rawAction.replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/i, '')).toLowerCase();

    // Default badge styling
    let type = 'ACTION';
    let badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
    let title = rawAction;
    let entityName = log.entity || 'System';

    // 1. Resolve Entity Friendly Name
    if (rawEntity.includes('installment-job') || rawPath.includes('installment-job')) entityName = 'Installment Job';
    else if (rawEntity.includes('customer') || rawPath.includes('customer')) entityName = 'Customer';
    else if (rawEntity.includes('order-status') || rawPath.includes('order-status')) entityName = 'Order Status';
    else if (rawEntity.includes('order') || rawPath.includes('order')) entityName = 'Order';
    else if (rawEntity.includes('user') || rawPath.includes('user')) entityName = 'Admin User';
    else if (rawEntity.includes('auth') || rawPath.includes('auth') || rawPath.includes('login')) entityName = 'Authentication';
    else if (rawEntity.includes('email-template') || rawPath.includes('email-template')) entityName = 'Email Template';
    else if (rawEntity.includes('email') || rawPath.includes('email')) entityName = 'Email';
    else if (rawEntity.includes('sms') || rawPath.includes('sms')) entityName = 'SMS Campaign';
    else if (rawEntity.includes('discount') || rawPath.includes('discount')) entityName = 'Discount Code';
    else if (rawEntity.includes('installment-plan') || rawPath.includes('installment-plan')) entityName = 'Installment Plan';
    else if (rawEntity.includes('production') || rawPath.includes('production')) entityName = 'Production Batch';
    else if (rawEntity.includes('security') || rawPath.includes('2fa') || rawPath.includes('mfa')) entityName = 'Security / 2FA';
    else if (log.entity) {
      entityName = log.entity.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    // 2. Resolve Action Type & Title
    if (rawAction === 'LOGIN' || rawPath.includes('/login') || rawAction.toLowerCase().includes('login') || rawAction.toLowerCase().includes('sign-in')) {
      type = 'LOGIN';
      badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
      title = 'Admin Sign-in';
    } else if (rawAction.includes('2FA') || rawPath.includes('2fa') || rawPath.includes('mfa')) {
      type = 'SECURITY';
      badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-200';
      title = rawAction.includes('ENABLE') || rawAction.includes('SETUP') ? 'Enable 2FA Authenticator' : (rawAction.includes('DISABLE') ? 'Disable 2FA' : '2FA Verification');
    } else if (rawAction.includes('TRIGGER') || rawPath.includes('/trigger') || rawPath.includes('/run') || rawAction.toLowerCase().includes('run')) {
      type = 'TRIGGER';
      badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
      title = `Trigger ${entityName}`;
    } else if (rawAction.includes('STATUS') || rawPath.includes('/status')) {
      type = 'STATUS';
      badgeClass = 'bg-cyan-100 text-cyan-800 border-cyan-200';
      title = `Update ${entityName} Status`;
    } else if (rawMethod === 'DELETE' || rawAction.startsWith('DELETE') || rawAction.toLowerCase().includes('delete') || rawAction.toLowerCase().includes('remove')) {
      type = 'DELETE';
      badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
      title = `Delete ${entityName}`;
    } else if (rawMethod === 'POST' || rawAction.startsWith('POST') || rawAction.toLowerCase().includes('create') || rawAction.toLowerCase().includes('add')) {
      type = 'CREATE';
      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
      title = `Create ${entityName}`;
    } else if (rawMethod === 'PUT' || rawMethod === 'PATCH' || rawAction.startsWith('PUT') || rawAction.startsWith('PATCH') || rawAction.toLowerCase().includes('update') || rawAction.toLowerCase().includes('edit')) {
      type = 'UPDATE';
      badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
      title = `Update ${entityName}`;
    } else {
      // If action is already a human string like "Toggle Installment Job"
      title = rawAction;
    }

    // Subtitle route for technical audit precision
    let subtitle = log.path || '';
    if (!subtitle && rawAction.startsWith('/api')) {
      subtitle = (rawMethod ? rawMethod + ' ' : '') + rawAction;
    } else if (log.method && log.path) {
      subtitle = `${log.method} ${log.path}`;
    }

    return { type, badgeClass, title, entityName, subtitle };
  };

  const checkIsSuccess = (log) => {
    if (log.status) return log.status === 'SUCCESS';
    if (log.statusCode) return log.statusCode >= 200 && log.statusCode < 400;
    return !log.error;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Immutable log of all administrative actions, order updates, and system changes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, IP, entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="TRIGGER">TRIGGER</option>
              <option value="STATUS">STATUS</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={entity}
              onChange={(e) => { setEntity(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="">All Entities</option>
              <option value="Order">Order</option>
              <option value="Customer">Customer</option>
              <option value="InstallmentJob">Installment Job</option>
              <option value="User">Admin User</option>
              <option value="auth">Authentication</option>
              <option value="EmailTemplate">Email Template</option>
              <option value="SMS">SMS Campaign</option>
              <option value="Discount">Discount Code</option>
              <option value="ProductionBatch">Production Batch</option>
              <option value="OrderStatus">Order Status</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              title="From date"
            />
          </div>

          <div className="sm:col-span-2 flex gap-2">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              title="To date"
            />
            <Button type="submit" size="sm" className="px-4">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">User</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Entity</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">IP Address</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    No audit log entries found
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = checkIsSuccess(log);
                  const parsed = parseAuditAction(log);
                  const userName = log.userName || log.user?.name;
                  const userEmail = log.userEmail || log.user?.email;
                  const displayName = userName || userEmail || 'System / Auto';
                  const initial = displayName.charAt(0).toUpperCase();

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {new Date(log.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                            {initial}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-xs">
                              {displayName}
                            </p>
                            {userName && userEmail && (
                              <p className="text-[11px] text-gray-400">{userEmail}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider ${parsed.badgeClass}`}>
                              {parsed.type}
                            </span>
                            <span className="font-semibold text-gray-900 text-xs">
                              {parsed.title}
                            </span>
                          </div>
                          {parsed.subtitle && (
                            <span className="text-[10px] font-mono text-gray-400 mt-0.5 max-w-[240px] truncate" title={parsed.subtitle}>
                              {parsed.subtitle}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <span className="font-semibold text-gray-800">{parsed.entityName}</span>
                        {log.entityId && (
                          <span className="text-gray-500 font-mono ml-1.5 bg-gray-100 px-1.5 py-0.5 rounded text-[11px] border border-gray-200">
                            #{log.entityId}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isSuccess ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {isSuccess ? 'Success' : 'Failed'}
                          </span>
                          {log.statusCode && (
                            <span className="text-[11px] font-mono text-gray-400">
                              ({log.statusCode})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                        {log.ip || log.ipAddress || '-'}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-8 px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm">
            <span className="text-gray-500 text-xs">
              Showing page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (() => {
        const parsedModal = parseAuditAction(selectedLog);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Audit Log Details #{selectedLog.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 rounded-lg hover:bg-gray-200"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                  <div>
                    <span className="text-gray-500 block">User:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedLog.userName || selectedLog.userEmail || selectedLog.user?.name || selectedLog.user?.email || 'System'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Action:</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${parsedModal.badgeClass}`}>
                        {parsedModal.type}
                      </span>
                      <span className="font-bold text-gray-900">{parsedModal.title}</span>
                    </div>
                    {parsedModal.subtitle && (
                      <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">{parsedModal.subtitle}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500 block">Entity:</span>
                    <span className="font-semibold text-gray-900">{parsedModal.entityName} {selectedLog.entityId ? `(#${selectedLog.entityId})` : ''}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Status:</span>
                    <span className={`font-semibold ${checkIsSuccess(selectedLog) ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {checkIsSuccess(selectedLog) ? 'Success' : 'Failed'}
                      {selectedLog.statusCode && ` (${selectedLog.statusCode})`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">IP Address:</span>
                    <span className="font-mono text-gray-700">{selectedLog.ip || selectedLog.ipAddress || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Timestamp:</span>
                    <span className="text-gray-900">{new Date(selectedLog.createdAt).toLocaleString('en-US')}</span>
                  </div>
                  {selectedLog.userAgent && (
                    <div className="col-span-2">
                      <span className="text-gray-500 block">Client / User Agent:</span>
                      <span className="text-gray-700 font-mono text-[11px] truncate block">{selectedLog.userAgent}</span>
                    </div>
                  )}
                </div>

                {selectedLog.error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
                    <div>
                      <span className="font-bold block">Error Message:</span>
                      <pre className="whitespace-pre-wrap font-mono mt-1 text-[11px]">{selectedLog.error}</pre>
                    </div>
                  </div>
                )}

                {/* Raw Details / Changes */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">Change Details / Payload</label>
                    <button
                      onClick={() => copyToClipboard(formatDetails(selectedLog.details))}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1 px-2 rounded hover:bg-indigo-50"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-xl font-mono text-xs max-h-72 overflow-auto border border-gray-800">
                    <pre>{formatDetails(selectedLog.details) || '// No extra data'}</pre>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AuditLogsPage;
