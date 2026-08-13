import React, { useState, useEffect } from 'react';
import {
  getInstallmentPlans,
  createInstallmentPlan,
  updateInstallmentPlan,
  deleteInstallmentPlan,
} from '../services/admin.service';
import {
  Plus, Edit2, Trash2, Loader2, X, CreditCard,
  ChevronDown, ChevronUp, AlertCircle, Sparkles, Check, Calculator, Wand2, Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';

const PROGRAMS = [
  'STX', 'HHX', 'HTX', 'HF', 'EUD', 'EUX',
  'sosuassistent', 'sosuhjælper', 'frisør', 'kosmetolog',
  'pædagog', 'pau', 'ernæringsassisten', 'STU', 'Landmand',
];

const TIERS = ['luksus', 'premium'];

const PREVIEW_PRICE = 2500;

const emptyRow = () => ({ label: '', dueLabel: '' });

const emptyForm = () => ({
  name: '',
  program: 'STX',
  packageTier: 'luksus',
  isActive: true,
  downPaymentAmount: '399',
  installments: [
    { label: 'Rate 2', dueLabel: '2 months after order' },
    { label: 'Rate 3', dueLabel: 'Before delivery (Month 5)' }
  ],
  notes: '',
});

const formatDKK = (val) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(val || 0);

const calcAmount = (totalPrice, downPayment, numInstallments) => {
  const remaining = Math.max(0, totalPrice - downPayment);
  return numInstallments > 0 ? remaining / numInstallments : 0;
};

// ─────────────────────────────────────────────────────────────
// Modal for Create/Edit
// ─────────────────────────────────────────────────────────────
const PlanModal = ({ plan, onClose, onSaved }) => {
  const isEdit = Boolean(plan?.id);
  const [form, setForm] = useState(
    isEdit
      ? {
          name: plan.name,
          program: plan.program,
          packageTier: plan.packageTier,
          isActive: plan.isActive,
          downPaymentAmount: String(plan.downPaymentAmount || 399),
          installments: Array.isArray(plan.installments) && plan.installments.length
            ? plan.installments.map(r => ({
                label: r.label || '',
                dueLabel: r.dueLabel || '',
              }))
            : [emptyRow()],
          notes: plan.notes || '',
        }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const [previewPrice, setPreviewPrice] = useState(PREVIEW_PRICE);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const setRow = (idx, key, val) =>
    setForm(prev => {
      const rows = [...prev.installments];
      rows[idx] = { ...rows[idx], [key]: val };
      return { ...prev, installments: rows };
    });

  const addRow = () => setForm(prev => ({ ...prev, installments: [...prev.installments, emptyRow()] }));
  const removeRow = (idx) =>
    setForm(prev => ({ ...prev, installments: prev.installments.filter((_, i) => i !== idx) }));

  const downPayment = parseFloat(form.downPaymentAmount) || 0;
  const numInstallments = form.installments.length;
  const splitAmount = calcAmount(previewPrice, downPayment, numInstallments);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Please enter a plan name');
    if (!form.downPaymentAmount) return toast.error('Please enter a down payment amount');

    setSaving(true);
    try {
      const payload = {
        ...form,
        downPaymentAmount: parseFloat(form.downPaymentAmount) || 399,
        installments: form.installments.map(r => ({
          label: r.label,
          dueLabel: r.dueLabel,
        }))
      };
      if (isEdit) {
        await updateInstallmentPlan(plan.id, payload);
        toast.success('Installment plan updated!');
      } else {
        await createInstallmentPlan(payload);
        toast.success('Installment plan created!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded border border-slate-200 shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#fafafa]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1e3a8a] rounded text-white">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEdit ? 'Edit Installment Plan' : 'Create New Installment Plan'}
              </h2>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                Dynamic equal-split payment plan for students
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Name & Target Program/Tier */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Plan Name *
              </label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. STX Luksus 3-Payment Installment Plan"
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Program *</label>
                <select
                  value={form.program}
                  onChange={e => set('program', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm font-bold text-slate-800 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Programs</option>
                  {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Package Tier *</label>
                <div className="flex gap-1.5">
                  {[...TIERS, 'all'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('packageTier', t)}
                      className={cn(
                        'flex-1 py-2 rounded text-xs font-bold border transition-all capitalize',
                        form.packageTier === t
                          ? t === 'standard' ? 'bg-slate-700 border-slate-700 text-white'
                            : t === 'luksus' ? 'bg-amber-500 border-amber-500 text-white'
                            : t === 'premium' ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white'
                            : 'bg-green-600 border-green-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {t === 'all' ? 'All' : t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Simulation Bar */}
          <div className="bg-[#f0f4f8] border border-slate-200 rounded p-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[#1e3a8a] shrink-0" />
              <span className="text-xs font-bold text-slate-800">Live Simulation Price:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={previewPrice}
                onChange={e => setPreviewPrice(parseFloat(e.target.value) || 0)}
                className="w-24 px-2.5 py-1 border border-slate-300 rounded text-xs font-bold text-[#1e3a8a] bg-white text-center"
              />
              <span className="text-xs font-bold text-slate-600">DKK</span>
            </div>
          </div>

          {/* 1st Payment (Down Payment Amount) */}
          <div className="bg-white border border-slate-200 rounded p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                1st Payment (Down Payment @ Checkout) *
              </label>
              <span className="text-xs font-bold text-[#1e3a8a]">
                = {formatDKK(downPayment)}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={form.downPaymentAmount}
                onChange={e => set('downPaymentAmount', e.target.value)}
                placeholder="399"
                className="w-full pl-4 pr-12 py-2 border border-slate-200 rounded text-base font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold">DKK</span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold">Student pays this initial deposit when placing order.</p>
          </div>

          {/* Subsequent Installment Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Subsequent Installments (Equally Divided)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addRow}
                  className="flex items-center gap-1 text-xs font-bold text-[#1e3a8a] hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add Rate
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {form.installments.map((row, idx) => (
                <div key={idx} className="bg-[#fafafa] border border-slate-200 p-3 rounded flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                  <input
                    value={row.label}
                    onChange={e => setRow(idx, 'label', e.target.value)}
                    placeholder={`Rate ${idx + 2}`}
                    className="w-full sm:w-28 px-3 py-1.5 border border-slate-200 rounded text-xs font-bold bg-white focus:outline-none focus:border-blue-400"
                  />
                  <input
                    value={row.dueLabel}
                    onChange={e => setRow(idx, 'dueLabel', e.target.value)}
                    placeholder="e.g. 2 months after order (or Month 5)"
                    className="flex-1 w-full px-3 py-1.5 border border-slate-200 rounded text-xs bg-white focus:outline-none focus:border-blue-400"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-xs font-bold text-[#1e3a8a] min-w-[70px] text-right">
                      {formatDKK(splitAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={form.installments.length === 1}
                      className="p-1.5 text-slate-300 hover:text-red-500 disabled:opacity-20 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Schedule Preview */}
          <div className="bg-[#1e3a8a] text-white rounded p-4 space-y-3 border border-blue-900">
            <div className="flex items-center justify-between border-b border-blue-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-400" /> Payment Schedule Preview ({previewPrice} DKK order)
              </span>
              <span className="text-xs font-bold text-green-400">
                Total: {formatDKK(previewPrice)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-white/10 p-2 rounded border border-white/10">
                <div>
                  <span className="font-bold text-white">1. Depositum (at checkout)</span>
                  <span className="text-[10px] text-blue-200 block">Immediate payment</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-300 text-sm">Fixed</span>
                  <span className="text-[11px] text-blue-100 block">{formatDKK(downPayment)}</span>
                </div>
              </div>

              {form.installments.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-white/10 p-2 rounded border border-white/10">
                  <div>
                    <span className="font-bold text-white">{r.label || `${i + 2}. rate`}</span>
                    <span className="text-[10px] text-blue-200 block">{r.dueLabel || 'Due date'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-200 text-sm">Split</span>
                    <span className="text-[11px] text-blue-100 block">{formatDKK(splitAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              Internal Notes (optional)
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="e.g. Approved for STX 2026 students batch..."
              className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 resize-none font-bold"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3 bg-[#fafafa] p-3 rounded border border-slate-200">
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                form.isActive ? 'bg-green-600' : 'bg-slate-300'
              )}
            >
              <span className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                form.isActive ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
            <span className="text-xs font-bold text-slate-800">
              {form.isActive ? 'Active (visible to students on frontend)' : 'Inactive (hidden from frontend)'}
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-[#fafafa] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            Ready to save
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm uppercase tracking-wider transition-all disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEdit ? 'SAVE CHANGES' : 'CREATE PLAN'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
const InstallmentPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, plan: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, planId: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await getInstallmentPlans();
      setPlans(data);
    } catch {
      toast.error('Failed to fetch installment plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInstallmentPlan(deleteModal.planId);
      toast.success('Installment plan deleted');
      fetchPlans();
    } catch {
      toast.error('Error deleting plan');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, planId: null });
    }
  };

  const tierBadge = (tier) => {
    const map = {
      standard: 'bg-slate-100 text-slate-700 border-slate-200',
      luksus: 'bg-amber-100 text-amber-800 border-amber-200',
      premium: 'bg-blue-100 text-blue-800 border-blue-200',
      all: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return map[tier] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#1e3a8a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1000px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Installment Plans</h2>
          <p className="text-sm text-slate-500">Configure equal-split payment plans for students</p>
        </div>
        <button
          onClick={() => setModal({ open: true, plan: null })}
          className="flex items-center gap-2 text-white bg-[#1e3a8a] hover:bg-blue-900 text-xs font-bold px-4 py-2.5 rounded shadow-sm uppercase tracking-wider transition-colors"
        >
          <Plus className="h-4 w-4" />
          ADD PLAN
        </button>
      </div>

      {/* Empty State */}
      {plans.length === 0 && (
        <div className="bg-white rounded border border-slate-200 p-12 text-center">
          <div className="p-4 bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-[#1e3a8a]" />
          </div>
          <p className="font-bold text-slate-800 text-base mb-1">No Installment Plans Configured</p>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">Create your first installment plan to allow students to pay in easy rates.</p>
          <button
            onClick={() => setModal({ open: true, plan: null })}
            className="inline-flex items-center gap-2 text-white bg-[#1e3a8a] hover:bg-blue-900 text-xs font-bold px-5 py-2.5 rounded shadow-sm uppercase tracking-wider transition-colors"
          >
            <Plus className="h-4 w-4" /> CREATE INSTALLMENT PLAN
          </button>
        </div>
      )}

      {/* Plans List Table/Cards */}
      {plans.length > 0 && (
        <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-[#fafafa] px-6 py-3 border-b border-slate-200 grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span className="col-span-5">PLAN & TARGET</span>
            <span className="col-span-3">1ST PAYMENT</span>
            <span className="col-span-2 text-center">RATES</span>
            <span className="col-span-2 text-right">ACTIONS</span>
          </div>

          <div className="divide-y divide-slate-100">
            {plans.map(plan => {
              const isExpanded = expandedId === plan.id;
              const rows = Array.isArray(plan.installments) ? plan.installments : [];

              return (
                <div key={plan.id} className={cn("transition-colors", plan.isActive ? "bg-white" : "bg-slate-50/60")}>
                  {/* Plan Main Header Row */}
                  <div className="px-6 py-4 grid grid-cols-12 items-center gap-2">
                    {/* Name & Badges */}
                    <div className="col-span-5 flex items-center gap-3">
                      <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", plan.isActive ? "bg-green-600" : "bg-slate-300")} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm">{plan.name}</span>
                          <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase border', tierBadge(plan.packageTier))}>
                            {plan.packageTier}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase border border-blue-100">
                            {plan.program}
                          </span>
                        </div>
                        {plan._count?.orders > 0 && (
                          <p className="text-[11px] font-bold text-green-600 mt-0.5">
                            {plan._count.orders} order{plan._count.orders !== 1 ? 's' : ''} placed
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Down Payment */}
                    <div className="col-span-3">
                      <span className="text-sm font-bold text-slate-800">{formatDKK(plan.downPaymentAmount || 399)}</span>
                      <span className="text-xs text-slate-500 block font-normal">Paid at checkout</span>
                    </div>

                    {/* Rates Count */}
                    <div className="col-span-2 text-center">
                      <span className="text-xs font-bold text-[#1e3a8a] bg-blue-50 px-2.5 py-1 rounded border border-blue-100 inline-block">
                        {rows.length} rate{rows.length !== 1 ? 'r' : ''}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        title="Toggle breakdown"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setModal({ open: true, plan })}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit plan"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, planId: plan.id })}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete plan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Breakdown Panel */}
                  {isExpanded && (
                    <div className="bg-[#fafafa] px-6 py-4 border-t border-slate-100 space-y-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        Payment Schedule Rules
                      </span>
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded px-4 py-2 text-xs">
                          <div>
                            <span className="font-bold text-slate-800">1. Depositum (at checkout)</span>
                            <span className="text-slate-400 block text-[10px]">Immediate payment</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[#1e3a8a] text-sm">Fixed</span>
                            <span className="text-[10px] text-slate-400 block">{formatDKK(plan.downPaymentAmount || 399)}</span>
                          </div>
                        </div>

                        {rows.map((row, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded px-4 py-2 text-xs">
                            <div>
                              <span className="font-bold text-slate-800">{row.label || `Rate ${idx + 2}`}</span>
                              {row.dueLabel && <span className="text-slate-400 block text-[10px]">{row.dueLabel}</span>}
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-800 text-sm">Equal Split</span>
                              <span className="text-[10px] text-slate-400 block">Remaining amount divided evenly</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {plan.notes && (
                        <div className="flex items-start gap-2 text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded p-2.5 max-w-2xl">
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          <span>{plan.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal.open && (
        <PlanModal
          plan={modal.plan}
          onClose={() => setModal({ open: false, plan: null })}
          onSaved={() => { setModal({ open: false, plan: null }); fetchPlans(); }}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Installment Plan"
        message="Are you sure you want to delete this plan? Existing orders will retain their payment snapshot."
        confirmText="Delete Plan"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, planId: null })}
      />
    </div>
  );
};

export default InstallmentPlansPage;
