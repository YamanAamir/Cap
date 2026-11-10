import React, { useState, useEffect } from 'react';
import {
  Clock, Play, Pause, Plus, Trash2, Edit2, Eye, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, ArrowRight, ShieldCheck, Calendar, Filter, CheckSquare, Square,
  Layers, ChevronRight, HelpCircle, Loader2
} from 'lucide-react';
import {
  getInstallmentJobs, createInstallmentJob, updateInstallmentJob,
  toggleInstallmentJob, deleteInstallmentJob, previewInstallmentJob,
  runInstallmentJobNow, getInstallmentJobLogs, getOrderStatuses
} from '../services/admin.service';
import { Button } from '../components/ui';
import toast from 'react-hot-toast';

const InstallmentJobsPage = () => {
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'logs'
  const [jobs, setJobs] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal: Create / Edit Job
  const [jobModal, setJobModal] = useState({
    isOpen: false,
    isEdit: false,
    jobId: null,
    name: '',
    targetStatusId: '',
    delayValue: 1,
    delayUnit: 'MONTHS',
    triggerTime: '09:00',
    orderDateFrom: '',
    orderDateTo: '',
    isActive: true,
  });
  const [savingJob, setSavingJob] = useState(false);

  // Modal: Preview & Manual Trigger
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    job: null,
    orders: [],
    loading: false,
    running: false,
    selectedOrderIds: [],
    filterState: 'ALL',
  });

  // Tab: Execution Logs
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsRes, statusesRes] = await Promise.all([
        getInstallmentJobs(),
        getOrderStatuses(),
      ]);
      setJobs(jobsRes || []);
      setOrderStatuses(statusesRes || []);
    } catch (err) {
      toast.error('Kunne ikke hente afdrags-jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await getInstallmentJobLogs({ page: logsPage, limit: 25 });
      setLogs(res.data || []);
      setLogsTotal(res.total || 0);
    } catch (err) {
      toast.error('Kunne ikke hente afviklingslogs');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, logsPage]);

  // Handle Save Job
  const handleSaveJob = async (e) => {
    e.preventDefault();
    if (!jobModal.name.trim()) {
      return toast.error('Angiv venligst et navn til jobbet');
    }
    if (!jobModal.targetStatusId) {
      return toast.error('Vælg venligst en mål-ordrestatus');
    }

    setSavingJob(true);
    try {
      const payload = {
        name: jobModal.name.trim(),
        targetStatusId: parseInt(jobModal.targetStatusId, 10),
        delayValue: parseInt(jobModal.delayValue, 10) || 1,
        delayUnit: jobModal.delayUnit,
        triggerTime: jobModal.triggerTime || '09:00',
        orderDateFrom: jobModal.orderDateFrom || null,
        orderDateTo: jobModal.orderDateTo || null,
        isActive: jobModal.isActive,
      };

      if (jobModal.isEdit) {
        await updateInstallmentJob(jobModal.jobId, payload);
        toast.success('Job opdateret');
      } else {
        await createInstallmentJob(payload);
        toast.success('Automatisk job oprettet');
      }

      setJobModal({ ...jobModal, isOpen: false });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kunne ikke gemme job');
    } finally {
      setSavingJob(false);
    }
  };

  // Toggle Active
  const handleToggle = async (job) => {
    try {
      await toggleInstallmentJob(job.id);
      toast.success(job.isActive ? 'Job sat på pause' : 'Job aktiveret');
      loadData();
    } catch (err) {
      toast.error('Kunne ikke ændre status');
    }
  };

  // Delete Job
  const handleDelete = async (job) => {
    if (!window.confirm(`Er du sikker på, at du vil slette jobbet "${job.name}"?`)) return;
    try {
      await deleteInstallmentJob(job.id);
      toast.success('Job slettet');
      loadData();
    } catch (err) {
      toast.error('Kunne ikke slette job');
    }
  };

  // Open Edit Modal
  const openEditModal = (job) => {
    setJobModal({
      isOpen: true,
      isEdit: true,
      jobId: job.id,
      name: job.name,
      targetStatusId: job.targetStatusId,
      delayValue: job.delayValue,
      delayUnit: job.delayUnit,
      triggerTime: job.triggerTime,
      orderDateFrom: job.orderDateFrom ? job.orderDateFrom.substring(0, 10) : '',
      orderDateTo: job.orderDateTo ? job.orderDateTo.substring(0, 10) : '',
      isActive: job.isActive,
    });
  };

  // Open Preview Modal
  const openPreview = async (job) => {
    setPreviewModal({
      isOpen: true,
      job,
      orders: [],
      loading: true,
      running: false,
      selectedOrderIds: [],
      filterState: 'ALL',
    });

    try {
      const res = await previewInstallmentJob(job.id);
      const orders = res.orders || [];
      const dueOrderIds = orders.filter(o => o.state === 'DUE').map(o => o.orderId);
      setPreviewModal(prev => ({
        ...prev,
        orders,
        loading: false,
        selectedOrderIds: dueOrderIds,
      }));
    } catch (err) {
      toast.error('Kunne ikke hente forhåndsvisning');
      setPreviewModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Run Now (Single or Bulk)
  const handleRunNow = async (orderIds = null) => {
    const idsToRun = orderIds || previewModal.selectedOrderIds;
    if (!idsToRun || idsToRun.length === 0) {
      return toast.error('Ingen ordrer valgt til afvikling');
    }

    if (!window.confirm(`Er du sikker på, at du vil udløse statusændring og afdrags-e-mails for ${idsToRun.length} ordre(r) nu?`)) {
      return;
    }

    setPreviewModal(prev => ({ ...prev, running: true }));
    try {
      const res = await runInstallmentJobNow(previewModal.job.id, idsToRun);
      toast.success(`Afviklet: ${res.triggeredCount || 0} ordre(r) udløst succesfuldt!`);
      // Refresh preview
      const previewRes = await previewInstallmentJob(previewModal.job.id);
      setPreviewModal(prev => ({
        ...prev,
        orders: previewRes.orders || [],
        running: false,
        selectedOrderIds: [],
      }));
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Fejl under manuel afvikling');
      setPreviewModal(prev => ({ ...prev, running: false }));
    }
  };

  // Filter preview orders by state
  const filteredPreviewOrders = previewModal.orders.filter(o => {
    if (previewModal.filterState === 'ALL') return true;
    return o.state === previewModal.filterState;
  });

  const getStateBadge = (state) => {
    switch (state) {
      case 'DUE':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-xs font-bold">Klar til udsendelse (DUE)</span>;
      case 'SCHEDULED':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-xs font-medium">Planlagt (Afventer dato)</span>;
      case 'WAITING_PREVIOUS':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-xs font-medium">Afventer Rate 2 betaling</span>;
      case 'ALREADY_IN_STATUS':
      case 'ALREADY_TRIGGERED':
        return <span className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded text-xs">Allerede udløst</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{state}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-600" />
            Automatiske Afdrags-Jobs (Installment Triggers)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Automatisk udløsning af rate-betalinger (Rate 2 & Rate 3) efter fastsat tidsinterval med indbygget sikkerhedslås.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setJobModal({
              isOpen: true,
              isEdit: false,
              jobId: null,
              name: '',
              targetStatusId: orderStatuses[0]?.id || '',
              delayValue: 1,
              delayUnit: 'MONTHS',
              triggerTime: '09:00',
              orderDateFrom: '',
              orderDateTo: '',
              isActive: true,
            })}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Opret Nyt Afdrags-Job
          </Button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex items-start gap-3 text-sm text-indigo-950">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-900">Sikkerhedslås mod parallelle rater (Fail-Safe)</p>
          <p className="text-xs text-indigo-800 leading-relaxed">
            Systemet beskytter automatisk mod, at Rate 2 og Rate 3 udløses samtidigt. Rate 3 vil <strong>aldrig</strong> blive udløst for en ordre, medmindre Rate 2 allerede er registreret som betalt, og det fastsatte tidsinterval er udløbet.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'jobs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Konfigurerede Jobs ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          Afviklingslogs
        </button>
      </div>

      {/* TAB 1: JOBS LIST */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Indlæser afdrags-jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm text-gray-500 space-y-3">
              <Clock className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-base font-semibold text-gray-700">Ingen automatiske afdrags-jobs oprettet endnu</p>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Opret et job for automatisk at flytte afdragsordrer til den næste rate-status og sende betalingslink efter f.eks. 1 måned.
              </p>
              <Button
                onClick={() => setJobModal({
                  isOpen: true,
                  isEdit: false,
                  jobId: null,
                  name: '',
                  targetStatusId: orderStatuses[0]?.id || '',
                  delayValue: 1,
                  delayUnit: 'MONTHS',
                  triggerTime: '09:00',
                  orderDateFrom: '',
                  orderDateTo: '',
                  isActive: true,
                })}
                className="mt-2"
              >
                Opret det første job
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => {
                const targetStatus = orderStatuses.find(s => s.id === job.targetStatusId);
                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between hover:border-indigo-300 transition-all"
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{job.name}</h3>
                          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            job.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {job.isActive ? <CheckCircle2 className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                            {job.isActive ? 'Aktiv (Auto-kører)' : 'Sat på pause'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggle(job)}
                          title={job.isActive ? 'Sæt på pause' : 'Aktivér'}
                          className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                            job.isActive
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {job.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Config Meta */}
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs border border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Mål-ordrestatus:</span>
                          <span className="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                            {targetStatus?.name || `Status #${job.targetStatusId}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Forsinkelse / Interval:</span>
                          <span className="font-medium text-indigo-700">
                            {job.delayValue} {job.delayUnit === 'MONTHS' ? 'Måned(er)' : 'Dag(e)'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Udsendelsestidspunkt:</span>
                          <span className="font-mono text-gray-800 font-semibold">{job.triggerTime || '09:00'} (DK tid)</span>
                        </div>
                        {(job.orderDateFrom || job.orderDateTo) && (
                          <div className="flex justify-between items-center pt-1 border-t border-gray-200 text-[11px]">
                            <span className="text-gray-500">Ordredato-filter:</span>
                            <span className="text-gray-700">
                              {job.orderDateFrom ? new Date(job.orderDateFrom).toLocaleDateString('da-DK') : 'Start'}
                              {' → '}
                              {job.orderDateTo ? new Date(job.orderDateTo).toLocaleDateString('da-DK') : 'Slut'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Last Run Info */}
                      <div className="text-[11px] text-gray-500">
                        {job.lastRunAt ? (
                          <span>Sidst kørt: {new Date(job.lastRunAt).toLocaleString('da-DK')}</span>
                        ) : (
                          <span className="text-gray-400">Har endnu ikke kørt automatisk</span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPreview(job)}
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        Forhåndsvis & Kør
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(job)}
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
                          title="Rediger job"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(job)}
                          className="h-8 w-8 p-0 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                          title="Slet job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXECUTION LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Udløsningshistorik for afdragsordrer</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              disabled={logsLoading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              Opdater logs
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Tidspunkt</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Job Navn</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Ordrenummer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Rate / Afdrag</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Kunde</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Besked / Fejl</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logsLoading && logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Indlæser afviklingslogs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400">
                      Ingen udløsningslogs endnu
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/70 text-xs">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('da-DK')}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                          {log.job?.name || `Job #${log.jobId}`}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-indigo-600 whitespace-nowrap">
                          {log.order?.orderNumber || (log.orderId ? `#${log.orderId}` : '-')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                            Rate {log.rateIndex != null ? log.rateIndex + 1 : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-800">
                          {log.order?.customerName || log.order?.customerEmail || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                            isSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                          {log.error || log.message || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT JOB */}
      {jobModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <form onSubmit={handleSaveJob}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">
                  {jobModal.isEdit ? 'Rediger Afdrags-Job' : 'Opret Nyt Afdrags-Job'}
                </h3>
                <button
                  type="button"
                  onClick={() => setJobModal({ ...jobModal, isOpen: false })}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 rounded-lg hover:bg-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Job Navn *</label>
                  <input
                    type="text"
                    required
                    placeholder="f.eks. Udløs Rate 2 betaling efter 1 måned"
                    value={jobModal.name}
                    onChange={(e) => setJobModal({ ...jobModal, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Mål-ordrestatus *</label>
                  <select
                    required
                    value={jobModal.targetStatusId}
                    onChange={(e) => setJobModal({ ...jobModal, targetStatusId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">Vælg ordrestatus...</option>
                    {orderStatuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || s.name})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Ordrer på afbetaling vil automatisk blive sat til denne status, hvilket udløser rate-betalingslinket og tilhørende e-mail.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Forsinkelse *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={jobModal.delayValue}
                      onChange={(e) => setJobModal({ ...jobModal, delayValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Enhed *</label>
                    <select
                      value={jobModal.delayUnit}
                      onChange={(e) => setJobModal({ ...jobModal, delayUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="MONTHS">Måned(er)</option>
                      <option value="DAYS">Dag(e)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Udsendelsestidspunkt (København tid)</label>
                  <input
                    type="time"
                    value={jobModal.triggerTime}
                    onChange={(e) => setJobModal({ ...jobModal, triggerTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Jobbet evaluerer og udløser ordrer, når klokken har passeret dette tidspunkt på forfaldsdatoen.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Kun ordrer oprettet fra (valgfri)</label>
                    <input
                      type="date"
                      value={jobModal.orderDateFrom}
                      onChange={(e) => setJobModal({ ...jobModal, orderDateFrom: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Kun ordrer oprettet til (valgfri)</label>
                    <input
                      type="date"
                      value={jobModal.orderDateTo}
                      onChange={(e) => setJobModal({ ...jobModal, orderDateTo: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    checked={jobModal.isActive}
                    onChange={(e) => setJobModal({ ...jobModal, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActiveCheckbox" className="text-xs font-semibold text-gray-700 cursor-pointer">
                    Jobbet er aktivt (kører automatisk via system-cron hver 5. minut)
                  </label>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setJobModal({ ...jobModal, isOpen: false })}
                >
                  Annuller
                </Button>
                <Button
                  type="submit"
                  disabled={savingJob}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                >
                  {savingJob && <Loader2 className="w-4 h-4 animate-spin" />}
                  {jobModal.isEdit ? 'Gem Ændringer' : 'Opret Job'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PREVIEW & MANUAL RUN NOW */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Ordre-evaluering & Manuel Udløsning
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Job: <strong>{previewModal.job?.name}</strong> • Forsinkelse: {previewModal.job?.delayValue} {previewModal.job?.delayUnit === 'MONTHS' ? 'mdr' : 'dage'}
                </p>
              </div>
              <button
                onClick={() => setPreviewModal({ ...previewModal, isOpen: false })}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 rounded-lg hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {previewModal.loading ? (
                <div className="py-16 text-center text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                  Evaluerer alle afdragsordrer og beregner forfaldsdatoer...
                </div>
              ) : (
                <>
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <button
                      onClick={() => setPreviewModal(prev => ({ ...prev, filterState: 'ALL' }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        previewModal.filterState === 'ALL'
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-gray-500 block">Scannet I alt</span>
                      <span className="text-lg font-bold text-gray-900">{previewModal.orders.length}</span>
                    </button>

                    <button
                      onClick={() => setPreviewModal(prev => ({ ...prev, filterState: 'DUE' }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        previewModal.filterState === 'DUE'
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-emerald-700 block font-semibold">Klar til udsendelse (DUE)</span>
                      <span className="text-lg font-bold text-emerald-700">
                        {previewModal.orders.filter(o => o.state === 'DUE').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setPreviewModal(prev => ({ ...prev, filterState: 'SCHEDULED' }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        previewModal.filterState === 'SCHEDULED'
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-blue-700 block font-semibold">Planlagt / Fremtidig</span>
                      <span className="text-lg font-bold text-blue-700">
                        {previewModal.orders.filter(o => o.state === 'SCHEDULED').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setPreviewModal(prev => ({ ...prev, filterState: 'WAITING_PREVIOUS' }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        previewModal.filterState === 'WAITING_PREVIOUS'
                          ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-amber-700 block font-semibold">Afventer Rate 2</span>
                      <span className="text-lg font-bold text-amber-700">
                        {previewModal.orders.filter(o => o.state === 'WAITING_PREVIOUS').length}
                      </span>
                    </button>
                  </div>

                  {/* Orders Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 text-left w-10">
                              <input
                                type="checkbox"
                                checked={
                                  filteredPreviewOrders.length > 0 &&
                                  filteredPreviewOrders.every(o => previewModal.selectedOrderIds.includes(o.orderId))
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const allFilteredIds = filteredPreviewOrders.map(o => o.orderId);
                                    setPreviewModal(prev => ({
                                      ...prev,
                                      selectedOrderIds: Array.from(new Set([...prev.selectedOrderIds, ...allFilteredIds])),
                                    }));
                                  } else {
                                    const filteredSet = new Set(filteredPreviewOrders.map(o => o.orderId));
                                    setPreviewModal(prev => ({
                                      ...prev,
                                      selectedOrderIds: prev.selectedOrderIds.filter(id => !filteredSet.has(id)),
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                              />
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Ordrenr.</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Kunde</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Oprettet</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Beregnet Forfaldsdato</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Status & Sikkerhed</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-600">Handling</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredPreviewOrders.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-8 text-gray-400">
                                Ingen ordrer matcher det valgte filter
                              </td>
                            </tr>
                          ) : (
                            filteredPreviewOrders.map((ord) => {
                              const isSelected = previewModal.selectedOrderIds.includes(ord.orderId);
                              return (
                                <tr key={ord.orderId} className={`hover:bg-gray-50/80 ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                                  <td className="px-3 py-2">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setPreviewModal(prev => ({
                                            ...prev,
                                            selectedOrderIds: [...prev.selectedOrderIds, ord.orderId],
                                          }));
                                        } else {
                                          setPreviewModal(prev => ({
                                            ...prev,
                                            selectedOrderIds: prev.selectedOrderIds.filter(id => id !== ord.orderId),
                                          }));
                                        }
                                      }}
                                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2 font-mono font-semibold text-gray-900">
                                    {ord.orderNumber}
                                  </td>
                                  <td className="px-3 py-2">
                                    <p className="font-medium text-gray-900">{ord.customerName || '-'}</p>
                                    <p className="text-gray-400 text-[11px]">{ord.customerEmail}</p>
                                  </td>
                                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                    {ord.orderDate ? new Date(ord.orderDate).toLocaleDateString('da-DK') : '-'}
                                  </td>
                                  <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">
                                    {ord.delayDueDate ? new Date(ord.delayDueDate).toLocaleString('da-DK') : '-'}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex flex-col gap-0.5">
                                      {getStateBadge(ord.state)}
                                      {ord.reason && (
                                        <span className="text-[10px] text-gray-400 leading-tight">
                                          {ord.reason}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={previewModal.running}
                                      onClick={() => handleRunNow([ord.orderId])}
                                      className="h-7 text-xs px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                    >
                                      Kør nu
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {previewModal.selectedOrderIds.length} ordre(r) valgt til udløsning
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewModal({ ...previewModal, isOpen: false })}
                >
                  Luk
                </Button>
                <Button
                  size="sm"
                  disabled={previewModal.selectedOrderIds.length === 0 || previewModal.running}
                  onClick={() => handleRunNow()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                >
                  {previewModal.running ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Udløs Valgte Ordrer Nu ({previewModal.selectedOrderIds.length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallmentJobsPage;
