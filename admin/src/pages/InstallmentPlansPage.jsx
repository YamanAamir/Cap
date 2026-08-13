import React, { useState, useEffect } from 'react';
import {
  getInstallmentPlans,
  createInstallmentPlan,
  updateInstallmentPlan,
  deleteInstallmentPlan,
} from '../services/admin.service';
import {
  Plus, Edit2, Trash2, Loader2, X, CreditCard,
  ChevronDown, ChevronUp, AlertCircle, Sparkles, Check, Calculator, Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';

const PROGRAMS = [
  'STX', 'HHX', 'HTX', 'HF', 'EUD', 'EUX',
  'sosuassistent', 'sosuhjælper', 'frisør', 'kosmetolog',
  'pædagog', 'pau', 'ernæringsassisten', 'STU', 'Landmand',
];

const TIERS = ['standard', 'luksus', 'premium'];

const PREVIEW_PRICE = 2500;

const emptyRow = () => ({ label: '', dueLabel: '', percent: '' });

const emptyForm = () => ({
  name: '',
  program: 'STX',
  packageTier: 'luksus',
  isActive: true,
  downPaymentPercent: '34',
  installments: [
    { label: 'Rate 2', dueLabel: '2 months after order', percent: '33' },
    { label: 'Rate 3', dueLabel: 'Before delivery (Month 5)', percent: '33' }
  ],
  notes: '',
});

const formatDKK = (val) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(val || 0);

const calcAmount = (percent, price) => ((parseFloat(percent) || 0) / 100) * price;

const totalPercent = (form) => {
  const down = parseFloat(form.downPaymentPercent) || 0;
  const rows = form.installments.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0);
  return down + rows;
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
          downPaymentPercent: String(plan.downPaymentPercent),
          installments: Array.isArray(plan.installments) && plan.installments.length
            ? plan.installments.map(r => ({
                label: r.label || '',
                dueLabel: r.dueLabel || '',
                percent: String(r.percent || ''),
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

  // Preset Template Applicator
  const applyPreset = (count) => {
    if (count === 3) {
      setForm(prev => ({
        ...prev,
        downPaymentPercent: '34',
        installments: [
          { label: '2. rate', dueLabel: '2 months after ordering', percent: '33' },
          { label: '3. rate (final)', dueLabel: 'Before delivery (Month 5)', percent: '33' }
        ]
      }));
    } else if (count === 4) {
      setForm(prev => ({
        ...prev,
        downPaymentPercent: '25',
        installments: [
          { label: '2. rate', dueLabel: '1 month after ordering', percent: '25' },
          { label: '3. rate', dueLabel: '3 months after ordering', percent: '25' },
          { label: '4. rate (final)', dueLabel: 'Before delivery (Month 5)', percent: '25' }
        ]
      }));
    } else if (count === 5) {
      setForm(prev => ({
        ...prev,
        downPaymentPercent: '20',
        installments: [
          { label: '2. rate', dueLabel: 'Month 2', percent: '20' },
          { label: '3. rate', dueLabel: 'Month 3', percent: '20' },
          { label: '4. rate', dueLabel: 'Month 4', percent: '20' },
          { label: '5. rate (final)', dueLabel: 'Before delivery (Month 5)', percent: '20' }
        ]
      }));
    }
    toast.success(`${count}-payment plan preset applied`);
  };

  // Auto balance remaining percentage across installment rows
  const autoBalance = () => {
    const down = parseFloat(form.downPaymentPercent) || 0;
    const remaining = 100 - down;
    if (remaining <= 0) return toast.error('Down payment must be less than 100%');
    if (form.installments.length === 0) return;

    const share = Math.floor((remaining / form.installments.length) * 10) / 10;
    let sum = share * form.installments.length;
    let diff = Math.round((remaining - sum) * 10) / 10;

    const newRows = form.installments.map((r, idx) => ({
      ...r,
      percent: String(idx === form.installments.length - 1 ? (share + diff).toFixed(1) : share.toFixed(1))
    }));

    setForm(prev => ({ ...prev, installments: newRows }));
    toast.success('Remaining percentage evenly distributed');
  };

  const usedPercent = totalPercent(form);
  const remaining = 100 - usedPercent;
  const percentOk = Math.abs(usedPercent - 100) <= 0.01;

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Please enter a plan name');
    if (!form.downPaymentPercent) return toast.error('Please enter down payment %');
    if (!percentOk) return toast.error(`Total percentages must equal 100%. Currently: ${usedPercent.toFixed(1)}%`);

    setSaving(true);
    try {
      const payload = {
        ...form,
        downPaymentPercent: parseFloat(form.downPaymentPercent),
        installments: form.installments
          .filter(r => r.label.trim())
          .map(r => ({ label: r.label, dueLabel: r.dueLabel, percent: parseFloat(r.percent) || 0 })),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                {isEdit ? 'Edit Installment Plan' : 'Create New Installment Plan'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Dynamic percentage-based payment plan for students
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Quick Preset Selector */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Quick Presets (1-Click Setup):
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(3)}
                className="py-2 px-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all text-center"
              >
                3 Payments
                <span className="block text-[10px] font-normal text-slate-400">34% / 33% / 33%</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(4)}
                className="py-2 px-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all text-center"
              >
                4 Payments
                <span className="block text-[10px] font-normal text-slate-400">25% × 4</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(5)}
                className="py-2 px-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all text-center"
              >
                5 Payments
                <span className="block text-[10px] font-normal text-slate-400">20% × 5 (5 Months)</span>
              </button>
            </div>
          </div>

          {/* Name & Target Program/Tier */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">
                Plan Name *
              </label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. STX Luksus 3-Payment Installment Plan"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">Program *</label>
                <select
                  value={form.program}
                  onChange={e => set('program', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Programs</option>
                  {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">Package Tier *</label>
                <div className="flex gap-1.5">
                  {[...TIERS, 'all'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('packageTier', t)}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-extrabold border transition-all capitalize',
                        form.packageTier === t
                          ? t === 'standard' ? 'bg-slate-800 border-slate-800 text-white'
                            : t === 'luksus' ? 'bg-amber-500 border-amber-500 text-white'
                            : t === 'premium' ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-emerald-600 border-emerald-600 text-white'
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
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-indigo-600 shrink-0" />
              <span className="text-xs font-bold text-indigo-900">Live Simulation Price:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={previewPrice}
                onChange={e => setPreviewPrice(parseFloat(e.target.value) || 0)}
                className="w-24 px-2.5 py-1 border border-indigo-300 rounded-lg text-xs font-black text-indigo-900 bg-white text-center"
              />
              <span className="text-xs font-bold text-indigo-700">DKK</span>
            </div>
          </div>

          {/* 1st Payment (Down Payment %) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                1st Payment (Down Payment @ Checkout) *
              </label>
              <span className="text-xs font-extrabold text-indigo-600">
                = {formatDKK(calcAmount(form.downPaymentPercent, previewPrice))}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="99"
                value={form.downPaymentPercent}
                onChange={e => set('downPaymentPercent', e.target.value)}
                placeholder="35"
                className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-base font-black text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute right-3.5 top-3 text-slate-400 font-bold">%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Student pays this initial deposit when placing order.</p>
          </div>

          {/* Subsequent Installment Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                Subsequent Installments
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={autoBalance}
                  className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                  title="Auto balance remaining % equally"
                >
                  <Wand2 className="h-3 w-3" /> Auto Balance ({remaining.toFixed(0)}%)
                </button>
                <button
                  type="button"
                  onClick={addRow}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add Rate
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {form.installments.map((row, idx) => (
                <div key={idx} className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                  <input
                    value={row.label}
                    onChange={e => setRow(idx, 'label', e.target.value)}
                    placeholder={`Rate ${idx + 2}`}
                    className="w-full sm:w-28 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:outline-none focus:border-indigo-400"
                  />
                  <input
                    value={row.dueLabel}
                    onChange={e => setRow(idx, 'dueLabel', e.target.value)}
                    placeholder="e.g. 2 months after order (or Month 5)"
                    className="flex-1 w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-400"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
                    <div className="relative w-20">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={row.percent}
                        onChange={e => setRow(idx, 'percent', e.target.value)}
                        placeholder="0"
                        className="w-full pl-2.5 pr-6 py-1.5 border border-slate-200 rounded-lg text-xs font-black bg-white focus:outline-none focus:border-indigo-400 text-right"
                      />
                      <span className="absolute right-2 top-2 text-slate-400 text-[10px] font-bold">%</span>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-700 min-w-[70px] text-right">
                      {formatDKK(calcAmount(row.percent, previewPrice))}
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

          {/* Percentage Total Progress Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Total Percentage Allocated:</span>
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-extrabold',
                percentOk ? 'bg-emerald-500 text-white' : remaining > 0 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
              )}>
                {usedPercent.toFixed(1)}% / 100%
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  percentOk ? 'bg-emerald-500' : usedPercent > 100 ? 'bg-red-500' : 'bg-amber-400'
                )}
                style={{ width: `${Math.min(usedPercent, 100)}%` }}
              />
            </div>

            {!percentOk && (
              <p className="text-xs text-amber-700 font-medium flex items-center gap-1 pt-1">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                {remaining > 0
                  ? `Need ${remaining.toFixed(1)}% more to reach 100%. Click "Auto Balance" above!`
                  : `Over by ${Math.abs(remaining).toFixed(1)}%. Total must be exactly 100%.`}
              </p>
            )}
          </div>

          {/* Visual Schedule Preview */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" /> Payment Schedule Preview ({previewPrice} DKK order)
              </span>
              <span className="text-xs font-black text-emerald-400">
                Total: {formatDKK(calcAmount(usedPercent, previewPrice))}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10">
                <div>
                  <span className="font-bold text-white">1. Depositum (at checkout)</span>
                  <span className="text-[10px] text-slate-300 block">Immediate payment</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-amber-300 text-sm">{form.downPaymentPercent || 0}%</span>
                  <span className="text-[11px] text-slate-300 block">{formatDKK(calcAmount(form.downPaymentPercent, previewPrice))}</span>
                </div>
              </div>

              {form.installments.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10">
                  <div>
                    <span className="font-bold text-white">{r.label || `${i + 2}. rate`}</span>
                    <span className="text-[10px] text-slate-300 block">{r.dueLabel || 'Due date'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-indigo-300 text-sm">{r.percent || 0}%</span>
                    <span className="text-[11px] text-slate-300 block">{formatDKK(calcAmount(r.percent, previewPrice))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">
              Internal Notes (optional)
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="e.g. Approved for STX 2026 students batch..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                form.isActive ? 'bg-indigo-600' : 'bg-slate-300'
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
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            {percentOk ? '✅ Ready to save' : '⚠️ Fix percentages to save'}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !percentOk}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-40 disabled:shadow-none"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Plan Changes' : 'Create Plan'}
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
      premium: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      all: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return map[tier] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Installment Plans</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create percentage-based payment plans for students
          </p>
        </div>
        <button
          onClick={() => setModal({ open: true, plan: null })}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-indigo-100"
        >
          <Plus className="h-4 w-4" />
          New Installment Plan
        </button>
      </div>

      {/* Empty State */}
      {plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
          <div className="p-4 bg-indigo-50 rounded-full mb-4">
            <CreditCard className="h-8 w-8 text-indigo-500" />
          </div>
          <p className="font-extrabold text-slate-800 text-base mb-1">No installment plans yet</p>
          <p className="text-xs text-slate-400 mb-5 max-w-sm">Create your first percentage-based installment plan to allow students to pay in easy rates</p>
          <button
            onClick={() => setModal({ open: true, plan: null })}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-extrabold rounded-xl shadow-md"
          >
            <Plus className="h-4 w-4" /> Create Installment Plan
          </button>
        </div>
      )}

      {/* Plans List */}
      {plans.length > 0 && (
        <div className="space-y-3">
          {plans.map(plan => {
            const isExpanded = expandedId === plan.id;
            const rows = Array.isArray(plan.installments) ? plan.installments : [];

            return (
              <div
                key={plan.id}
                className={cn(
                  'bg-white border rounded-2xl overflow-hidden transition-all shadow-sm',
                  plan.isActive ? 'border-slate-200/80 hover:border-slate-300' : 'border-slate-100 opacity-75'
                )}
              >
                {/* Plan Header Row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className={cn(
                    'h-3 w-3 rounded-full shrink-0',
                    plan.isActive ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-slate-300'
                  )} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-800 text-sm">{plan.name}</span>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border', tierBadge(plan.packageTier))}>
                        {plan.packageTier}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 uppercase border border-blue-100">
                        {plan.program}
                      </span>
                      {!plan.isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-slate-500">
                        1st payment: <strong className="text-slate-800 font-bold">{plan.downPaymentPercent}%</strong>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500">
                        {rows.length} rate{rows.length !== 1 ? 'r' : ''}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500">
                        Total splits: <strong className="text-indigo-700 font-extrabold">
                          {(parseFloat(plan.downPaymentPercent) + rows.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0)).toFixed(0)}%
                        </strong>
                      </span>
                      {plan._count?.orders > 0 && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs font-bold text-emerald-700">
                            {plan._count.orders} order{plan._count.orders !== 1 ? 's' : ''} placed
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                      title="View Details"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setModal({ open: true, plan })}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, planId: plan.id })}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/60 space-y-3">
                    <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
                      Payment Schedule (% of student's total price)
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-xl px-4 py-2.5">
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">1. Depositum (at checkout)</p>
                          <p className="text-[10px] text-slate-400">Immediate payment</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-indigo-700">{plan.downPaymentPercent}%</span>
                          <p className="text-[10px] text-slate-400">e.g. {Math.round(plan.downPaymentPercent / 100 * 2500)} DKK on 2.500 order</p>
                        </div>
                      </div>

                      {rows.map((row, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white border border-slate-200/80 rounded-xl px-4 py-2.5">
                          <div>
                            <p className="text-xs font-extrabold text-slate-800">{row.label || `Rate ${idx + 2}`}</p>
                            {row.dueLabel && <p className="text-[10px] text-slate-400">{row.dueLabel}</p>}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-slate-800">{row.percent}%</span>
                            <p className="text-[10px] text-slate-400">e.g. {Math.round((row.percent || 0) / 100 * 2500)} DKK on 2.500 order</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {plan.notes && (
                      <div className="mt-2 flex items-start gap-2 text-xs text-slate-600 bg-amber-50/80 border border-amber-200/80 rounded-xl px-3.5 py-2.5">
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
