import React, { useState, useEffect } from 'react';
import {
  History, Search, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  ShieldCheck, Monitor, Smartphone, Tablet, Globe, Calendar, Filter
} from 'lucide-react';
import { getLoginHistory } from '../services/admin.service';
import { Button } from '../components/ui';
import toast from 'react-hot-toast';

const LoginHistoryPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await getLoginHistory({
        page,
        limit,
        search: search.trim() || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kunne ikke hente login-historik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, status]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const getDeviceIcon = (device) => {
    const d = (device || '').toLowerCase();
    if (d.includes('mobile') || d.includes('phone')) {
      return <Smartphone className="w-4 h-4 text-purple-600" />;
    }
    if (d.includes('tablet') || d.includes('ipad')) {
      return <Tablet className="w-4 h-4 text-amber-600" />;
    }
    return <Monitor className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-7 h-7 text-indigo-600" />
            Login Historik
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Se alle login-forsøg for administratorer og brugere med IP, enhed og 2FA-status.
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Søg på email, IP, browser, enhed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="">Alle statuser</option>
              <option value="SUCCESS">Succesfulde logins</option>
              <option value="FAILED">Fejlede logins</option>
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tidspunkt</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Bruger / Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">2FA</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Enhed & Browser</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Operativsystem</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">IP Adresse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Indlæser login historik...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    Ingen login-forsøg fundet
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';
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
                        <p className="font-semibold text-gray-900 text-xs">
                          {log.user?.name || log.email}
                        </p>
                        {log.user?.name && (
                          <p className="text-[11px] text-gray-400">{log.email}</p>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold w-max ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isSuccess ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {isSuccess ? 'Godkendt' : 'Afvist'}
                          </span>
                          {!isSuccess && log.failureReason && (
                            <span className="text-[11px] text-rose-500 mt-0.5">
                              {log.failureReason}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {log.twoFactorUsed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            2FA Verificeret
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(log.device)}
                          <div>
                            <span className="font-medium text-gray-800">{log.browser || 'Ukendt browser'}</span>
                            <span className="text-gray-400 text-[11px] ml-1">({log.device || 'Desktop'})</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap font-medium">
                        {log.os || '-'}
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {log.ipAddress || '-'}
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
    </div>
  );
};

export default LoginHistoryPage;
