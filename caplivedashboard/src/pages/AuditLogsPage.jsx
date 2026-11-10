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

  const getActionBadge = (act) => {
    const a = (act || '').toUpperCase();
    if (a.includes('CREATE') || a.includes('ADD') || a.includes('POST')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('PUT') || a.includes('PATCH')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (a.includes('DELETE') || a.includes('REMOVE')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (a.includes('TRIGGER') || a.includes('RUN') || a.includes('SEND')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
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
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="AUTH">AUTH</option>
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
              <option value="User">User</option>
              <option value="auth">Auth</option>
              <option value="InstallmentJob">InstallmentJob</option>
              <option value="ProductionBatch">ProductionBatch</option>
              <option value="OrderStatus">OrderStatus</option>
              <option value="Setting">Setting</option>
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <span className="font-semibold text-gray-800">{log.entity || '-'}</span>
                        {log.entityId && (
                          <span className="text-gray-400 font-mono ml-1.5">#{log.entityId}</span>
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
      {selectedLog && (
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
                  <span className={`inline-flex px-2 py-0.5 rounded font-bold ${getActionBadge(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Entity:</span>
                  <span className="font-medium text-gray-900">{selectedLog.entity} ({selectedLog.entityId || 'N/A'})</span>
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
      )}
    </div>
  );
};

export default AuditLogsPage;
