import React, { useState, useEffect } from 'react';
import {
  Clock, Play, Pause, Plus, Trash2, Edit2, Eye, RefreshCw,
  CheckCircle2, XCircle, ShieldCheck, Layers, Loader2
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
      toast.error('Failed to load installment jobs');
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
      toast.error('Failed to load execution logs');
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
      return toast.error('Please provide a name for the job');
    }
    if (!jobModal.targetStatusId) {
      return toast.error('Please select a target order status');
    }

    setSavingJob(true);
    try {
      const selectedStatusId = parseInt(jobModal.targetStatusId, 10);
      const timeVal = jobModal.triggerTime || '09:00';
      const payload = {
        name: jobModal.name.trim(),
        statusId: selectedStatusId,
        targetStatusId: selectedStatusId,
        delayValue: parseInt(jobModal.delayValue, 10) || 1,
        delayUnit: jobModal.delayUnit,
        sendTime: timeVal,
        triggerTime: timeVal,
        onlyOrdersAfter: jobModal.orderDateFrom ? new Date(jobModal.orderDateFrom) : null,
        orderDateFrom: jobModal.orderDateFrom || null,
        orderDateTo: jobModal.orderDateTo || null,
        isActive: jobModal.isActive,
      };

      if (jobModal.isEdit) {
        await updateInstallmentJob(jobModal.jobId, payload);
        toast.success('Job updated successfully');
      } else {
        await createInstallmentJob(payload);
        toast.success('Automated job created successfully');
      }

      setJobModal({ ...jobModal, isOpen: false });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job');
    } finally {
      setSavingJob(false);
    }
  };

  // Toggle Active
  const handleToggle = async (job) => {
    try {
      await toggleInstallmentJob(job.id);
      toast.success(job.isActive ? 'Job paused' : 'Job activated');
      loadData();
    } catch (err) {
      toast.error('Failed to toggle job status');
    }
  };

  // Delete Job
  const handleDelete = async (job) => {
    if (!window.confirm(`Are you sure you want to delete the job "${job.name}"?`)) return;
    try {
      await deleteInstallmentJob(job.id);
      toast.success('Job deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete job');
    }
  };

  // Open Edit Modal
  const openEditModal = (job) => {
    setJobModal({
      isOpen: true,
      isEdit: true,
      jobId: job.id,
      name: job.name,
      targetStatusId: job.targetStatusId || job.statusId,
      delayValue: job.delayValue,
      delayUnit: job.delayUnit,
      triggerTime: job.triggerTime || job.sendTime || '09:00',
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
      configError: null,
    });

    try {
      const res = await previewInstallmentJob(job.id);
      const orders = res.orders || res.rows || [];
      const dueOrderIds = orders.filter(o => o.state === 'DUE').map(o => o.orderId);
      setPreviewModal(prev => ({
        ...prev,
        orders,
        loading: false,
        selectedOrderIds: dueOrderIds,
        configError: res.error || null,
      }));
    } catch (err) {
      toast.error('Failed to load preview');
      setPreviewModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Run Now (Single or Bulk)
  const handleRunNow = async (orderIds = null) => {
    const idsToRun = orderIds || previewModal.selectedOrderIds;
    if (!idsToRun || idsToRun.length === 0) {
      return toast.error('No orders selected for trigger');
    }

    if (!window.confirm(`Are you sure you want to trigger status update and installment emails for ${idsToRun.length} order(s) now?`)) {
      return;
    }

    setPreviewModal(prev => ({ ...prev, running: true }));
    try {
      const res = await runInstallmentJobNow(previewModal.job.id, idsToRun);
      toast.success(`Executed: ${res.triggeredCount !== undefined ? res.triggeredCount : (res.triggered || 0)} order(s) triggered successfully!`);
      // Refresh preview
      const previewRes = await previewInstallmentJob(previewModal.job.id);
      const refreshedOrders = previewRes.orders || previewRes.rows || [];
      setPreviewModal(prev => ({
        ...prev,
        orders: refreshedOrders,
        running: false,
        selectedOrderIds: [],
        configError: previewRes.error || null,
      }));
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error during manual trigger');
      setPreviewModal(prev => ({ ...prev, running: false }));
    }
  };

  // Filter preview orders by state
  const filteredPreviewOrders = previewModal.orders.filter(o => {
    if (previewModal.filterState === 'ALL') return true;
    if (previewModal.filterState === 'ALREADY') {
      return ['ALREADY_IN_STATUS', 'ALREADY_TRIGGERED', 'ALREADY_PAID'].includes(o.state);
    }
    return o.state === previewModal.filterState;
  });

  const getStateBadge = (state) => {
    switch (state) {
      case 'DUE':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-xs font-bold">Ready to Trigger (DUE)</span>;
      case 'SCHEDULED':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-xs font-medium">Scheduled (Pending Date)</span>;
      case 'WAITING_PREVIOUS':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-xs font-medium">Waiting for Rate 2</span>;
      case 'ALREADY_IN_STATUS':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-xs font-medium">Already in Status</span>;
      case 'ALREADY_TRIGGERED':
        return <span className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-xs">Triggered Earlier</span>;
      case 'ALREADY_PAID':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-medium">Paid</span>;
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
            Automated Installment Jobs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated status updates and payment request emails for installment orders (Rate 2 & Rate 3) with safety locking.
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
            Create Installment Job
          </Button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex items-start gap-3 text-sm text-indigo-950">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-900">Fail-Safe Protection Against Simultaneous Rates</p>
          <p className="text-xs text-indigo-800 leading-relaxed">
            The system automatically prevents Rate 2 and Rate 3 from triggering simultaneously. Rate 3 will <strong>never</strong> trigger for an order unless Rate 2 is verified as PAID and the scheduled interval has passed.
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
          Configured Jobs ({jobs.length})
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
          Execution Logs
        </button>
      </div>

      {/* TAB 1: JOBS LIST */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading installment jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm text-gray-500 space-y-3">
              <Clock className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-base font-semibold text-gray-700">No automated installment jobs created yet</p>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Create a job to automatically transition installment orders to the next rate status and send payment links after e.g. 1 month.
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
                Create First Job
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => {
                const targetStatus = orderStatuses.find(s => s.id === (job.targetStatusId || job.statusId)) || (job.statusName ? { name: job.statusName, color: job.statusColor } : null);
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
                            {job.isActive ? 'Active (Auto-running)' : 'Paused'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggle(job)}
                          title={job.isActive ? 'Pause job' : 'Activate job'}
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
                          <span className="text-gray-500">Target Order Status:</span>
                          <span className="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                            {targetStatus?.name || job.statusName || `Status #${job.statusId || job.targetStatusId || ''}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Delay / Interval:</span>
                          <span className="font-medium text-indigo-700">
                            {job.delayValue} {job.delayUnit === 'MONTHS' ? 'Month(s)' : 'Day(s)'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Trigger Time:</span>
                          <span className="font-mono text-gray-800 font-semibold">{job.triggerTime || '09:00'} (Copenhagen Time)</span>
                        </div>
                        {(job.orderDateFrom || job.orderDateTo) && (
                          <div className="flex justify-between items-center pt-1 border-t border-gray-200 text-[11px]">
                            <span className="text-gray-500">Order Date Filter:</span>
                            <span className="text-gray-700">
                              {job.orderDateFrom ? new Date(job.orderDateFrom).toLocaleDateString('en-US') : 'Start'}
                              {' → '}
                              {job.orderDateTo ? new Date(job.orderDateTo).toLocaleDateString('en-US') : 'End'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Last Run Info */}
                      <div className="text-[11px] text-gray-500">
                        {job.lastRunAt ? (
                          <span>Last run: {new Date(job.lastRunAt).toLocaleString('en-US')}</span>
                        ) : (
                          <span className="text-gray-400">Has not run automatically yet</span>
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
                        Preview & Run
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(job)}
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
                          title="Edit job"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(job)}
                          className="h-8 w-8 p-0 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                          title="Delete job"
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
            <h3 className="font-bold text-gray-900 text-sm">Installment Order Trigger History</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              disabled={logsLoading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              Refresh logs
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Timestamp</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Job Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Order Number</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Rate / Installment</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Message / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logsLoading && logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading execution logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400">
                      No trigger logs recorded yet
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/70 text-xs">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('en-US')}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                          {log.jobName || log.job?.name || `Job #${log.jobId}`}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-indigo-600 whitespace-nowrap">
                          {log.orderNumber ? (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold font-mono">
                              {log.orderNumber}
                            </span>
                          ) : (log.order?.orderNumber ? (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold font-mono">
                              {log.order.orderNumber}
                            </span>
                          ) : (
                            log.orderId ? `#${log.orderId}` : '-'
                          ))}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                            Rate {log.installmentIndex != null ? log.installmentIndex + 1 : (log.rateIndex != null ? log.rateIndex + 1 : '2')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-800">
                          {log.customerEmail || log.order?.customerEmail || log.order?.customerName || '-'}
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
                  {jobModal.isEdit ? 'Edit Installment Job' : 'Create New Installment Job'}
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
                  <label className="block font-semibold text-gray-700 mb-1">Job Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Trigger Rate 2 payment after 1 month"
                    value={jobModal.name}
                    onChange={(e) => setJobModal({ ...jobModal, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Target Order Status *</label>
                  <select
                    required
                    value={jobModal.targetStatusId}
                    onChange={(e) => setJobModal({ ...jobModal, targetStatusId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">Select order status...</option>
                    {orderStatuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || s.name})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Matching installment orders will automatically be moved to this status, triggering the payment link and corresponding email.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Delay *</label>
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
                    <label className="block font-semibold text-gray-700 mb-1">Unit *</label>
                    <select
                      value={jobModal.delayUnit}
                      onChange={(e) => setJobModal({ ...jobModal, delayUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="MONTHS">Month(s)</option>
                      <option value="DAYS">Day(s)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Trigger Time of Day (Copenhagen Time)</label>
                  <input
                    type="time"
                    value={jobModal.triggerTime}
                    onChange={(e) => setJobModal({ ...jobModal, triggerTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    The job evaluates and triggers eligible orders once the local clock reaches this time on the due date.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Only orders created from (optional)</label>
                    <input
                      type="date"
                      value={jobModal.orderDateFrom}
                      onChange={(e) => setJobModal({ ...jobModal, orderDateFrom: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Only orders created to (optional)</label>
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
                    Job is active (runs automatically via system cron every 5 minutes)
                  </label>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setJobModal({ ...jobModal, isOpen: false })}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingJob}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                >
                  {savingJob && <Loader2 className="w-4 h-4 animate-spin" />}
                  {jobModal.isEdit ? 'Save Changes' : 'Create Job'}
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
                    Order Evaluation & Manual Trigger
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Job: <strong>{previewModal.job?.name}</strong> • Delay: {previewModal.job?.delayValue} {previewModal.job?.delayUnit === 'MONTHS' ? 'months' : 'days'}
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
              {previewModal.configError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{previewModal.configError}</span>
                </div>
              )}

              {previewModal.loading ? (
                <div className="py-16 text-center text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                  Evaluating all installment orders and calculating due dates...
                </div>
              ) : (
                <>
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    <button
                      onClick={() => setPreviewModal(prev => ({ ...prev, filterState: 'ALL' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        previewModal.filterState === 'ALL'
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-gray-500 block text-[11px]">Total Scanned</span>
                      <span className="text-base font-bold text-gray-900">{previewModal.orders.length}</span>
                    </button>

                    <button
                      onClick={() => setPreviewModal(prev => ({ ...prev, filterState: 'DUE' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        previewModal.filterState === 'DUE'
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-emerald-700 block text-[11px] font-semibold">Ready (DUE)</span>
                      <span className="text-base font-bold text-emerald-700">
                        {previewModal.orders.filter(o => o.state === 'DUE').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setPreviewModal(prev => ({ ...prev, filterState: 'SCHEDULED' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        previewModal.filterState === 'SCHEDULED'
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-blue-700 block text-[11px] font-semibold">Scheduled / Future</span>
                      <span className="text-base font-bold text-blue-700">
                        {previewModal.orders.filter(o => o.state === 'SCHEDULED').length}
                      </span>
                    </button>

                    <button
                      onClick={() => setPreviewModal(prev => ({ ...prev, filterState: 'ALREADY' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        previewModal.filterState === 'ALREADY'
                          ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-purple-700 block text-[11px] font-semibold">In Status / Sent</span>
                      <span className="text-base font-bold text-purple-700">
                        {previewModal.orders.filter(o => ['ALREADY_IN_STATUS', 'ALREADY_TRIGGERED', 'ALREADY_PAID'].includes(o.state)).length}
                      </span>
                    </button>

                    <button
                      onClick={() => setPreviewModal(prev => ({ ...prev, filterState: 'WAITING_PREVIOUS' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        previewModal.filterState === 'WAITING_PREVIOUS'
                          ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-amber-700 block text-[11px] font-semibold">Waiting for Prev Rate</span>
                      <span className="text-base font-bold text-amber-700">
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
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Order #</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Customer</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Created</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Calculated Due Date</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Status & Safeguards</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-600">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredPreviewOrders.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-8 text-gray-400">
                                No orders match the selected filter
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
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-xs">
                                      {ord.orderNumber || `#${ord.orderId}`}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <p className="font-semibold text-gray-900">{ord.customerName || '-'}</p>
                                    <p className="text-gray-400 text-[11px] font-mono">{ord.customerEmail}</p>
                                  </td>
                                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                    {ord.orderDate ? new Date(ord.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {ord.delayDueDate || ord.dueAt ? (
                                      <span className="font-medium text-gray-800">
                                        {ord.delayDueDate ? new Date(ord.delayDueDate).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ord.dueAt}
                                      </span>
                                    ) : '-'}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex flex-col gap-0.5">
                                      <div>{getStateBadge(ord.state)}</div>
                                      {ord.reason && (
                                        <span className="text-[10px] text-gray-500 leading-tight">
                                          {ord.reason}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-right whitespace-nowrap">
                                    {ord.state === 'DUE' ? (
                                      <Button
                                        size="sm"
                                        disabled={previewModal.running}
                                        onClick={() => handleRunNow([ord.orderId])}
                                        className="h-7 text-xs px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                                      >
                                        Trigger now
                                      </Button>
                                    ) : (
                                      <span className="text-gray-400 text-[11px] italic">Protected</span>
                                    )}
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
                {previewModal.selectedOrderIds.length} order(s) selected for trigger
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewModal({ ...previewModal, isOpen: false })}
                >
                  Close
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
                  Trigger Selected Orders Now ({previewModal.selectedOrderIds.length})
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
