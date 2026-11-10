import React, { useState, useEffect } from 'react';
import {
  Webhook, Search, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  Eye, Copy, Check, Filter, Clock, Globe, ArrowRight, Code
} from 'lucide-react';
import { getWebhookLogs, getWebhookLog } from '../services/admin.service';
import { Button } from '../components/ui';
import toast from 'react-hot-toast';

const WebhookLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ success: 0, failed: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // View modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await getWebhookLogs({
        page,
        limit,
        provider: provider || undefined,
        status: status || undefined,
        search: search.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setLogs(res.data || []);
      setTotal(res.total || 0);
      setStats(res.stats || { success: 0, failed: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kunne ikke hente webhook logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, provider, status]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const openLogDetails = async (logId) => {
    setViewLoading(true);
    try {
      const data = await getWebhookLog(logId);
      setSelectedLog(data);
    } catch (err) {
      toast.error('Kunne ikke hente webhook detaljer');
    } finally {
      setViewLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Kopieret til udklipsholder');
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const formatPayload = (payload) => {
    if (!payload) return '';
    if (typeof payload === 'object') {
      try {
        return JSON.stringify(payload, null, 2);
      } catch (e) {
        return String(payload);
      }
    }
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return payload;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Webhook className="w-7 h-7 text-indigo-600" />
            Webhook Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overvåg indgående webhooks fra betalingsgateways (Frisbii / Flatpay, Stripe m.fl.)
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
            Opdater
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">I alt modtaget</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{total.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Webhook className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Succesfulde</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.success?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fejlede</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{stats.failed?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg">
              <XCircle className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Søg på event, reference, ordre-nr..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={provider}
              onChange={(e) => { setProvider(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="">Alle udbydere</option>
              <option value="frisbii">Frisbii / Flatpay</option>
              <option value="stripe">Stripe</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="">Alle statusser</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              title="Fra dato"
            />
          </div>

          <div className="sm:col-span-2 flex gap-2">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              title="Til dato"
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
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tidspunkt</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Udbyder</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Event Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Reference / Ordre</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Varighed</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Indlæser webhook logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    Ingen webhook logs fundet
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';
                  const isFrisbii = log.provider?.toLowerCase().includes('frisbii') || log.provider?.toLowerCase().includes('flatpay');
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {new Date(log.createdAt).toLocaleString('da-DK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isFrisbii
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {isFrisbii ? 'Frisbii / Flatpay' : 'Stripe'}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-gray-800">
                        <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {log.eventType}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-900">
                        {log.reference || (
                          <span className="text-gray-400 italic font-normal text-xs">-</span>
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
                            {log.status}
                          </span>
                          {log.httpStatus && (
                            <span className="text-xs text-gray-400 font-mono">
                              ({log.httpStatus})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {log.durationMs != null ? `${log.durationMs}ms` : '-'}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openLogDetails(log.id)}
                          className="h-8 px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Vis Payload
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
              Viser side {page} af {totalPages} ({total} i alt)
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Forrige
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Næste
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Webhook Detaljer & Payload
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
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block">Udbyder:</span>
                  <span className="font-semibold text-gray-900">{selectedLog.provider}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Event:</span>
                  <span className="font-mono text-gray-900 font-semibold">{selectedLog.eventType}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">HTTP Status:</span>
                  <span className="font-mono font-bold text-indigo-600">{selectedLog.httpStatus || 200}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Varighed:</span>
                  <span className="font-medium text-gray-900">{selectedLog.durationMs != null ? `${selectedLog.durationMs}ms` : '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Reference / Ordre:</span>
                  <span className="font-medium text-gray-900">{selectedLog.reference || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Afsenders IP:</span>
                  <span className="font-mono text-gray-700">{selectedLog.ipAddress || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block">Tidspunkt:</span>
                  <span className="text-gray-900">{new Date(selectedLog.createdAt).toLocaleString('da-DK')}</span>
                </div>
              </div>

              {/* Error if failed */}
              {selectedLog.error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
                  <div>
                    <span className="font-bold block">Fejl under behandling:</span>
                    <pre className="whitespace-pre-wrap font-mono mt-1 text-[11px]">{selectedLog.error}</pre>
                  </div>
                </div>
              )}

              {/* Raw JSON Payload */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">JSON Payload</label>
                  <button
                    onClick={() => copyToClipboard(formatPayload(selectedLog.payload))}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1 px-2 rounded hover:bg-indigo-50"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Kopieret!' : 'Kopiér JSON'}
                  </button>
                </div>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-xl font-mono text-xs max-h-80 overflow-auto border border-gray-800">
                  <pre>{formatPayload(selectedLog.payload) || '// Tom payload'}</pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Luk
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookLogsPage;

