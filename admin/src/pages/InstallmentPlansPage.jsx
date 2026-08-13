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
                Dynamic percentage-based payment plan for students
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Quick Preset Selector */}
          <div className="bg-[#f0f4f8] p-3.5 rounded border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Quick Presets (1-Click Setup):
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(3)}
                className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 transition-all text-center"
              >
                3 Payments
                <span className="block text-[10px] font-normal text-slate-500">34% / 33% / 33%</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(4)}
                className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 transition-all text-center"
              >
                4 Payments
                <span className="block text-[10px] font-normal text-slate-500">25% × 4</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(5)}
                className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 transition-all text-center"
              >
                5 Payments
                <span className="block text-[10px] font-normal text-slate-500">20% × 5 (5 Months)</span>
              </button>
            </div>
          </div>

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

          {/* 1st Payment (Down Payment %) */}
          <div className="bg-white border border-slate-200 rounded p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                1st Payment (Down Payment @ Checkout) *
              </label>
              <span className="text-xs font-bold text-[#1e3a8a]">
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
                className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded text-base font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold">%</span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold">Student pays this initial deposit when placing order.</p>
          </div>

          {/* Subsequent Installment Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Subsequent Installments
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={autoBalance}
                  className="flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded transition-colors"
                  title="Auto balance remaining % equally"
                >
                  <Wand2 className="h-3 w-3" /> Auto Balance ({remaining.toFixed(0)}%)
                </button>
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
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
                    <div className="relative w-20">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={row.percent}
                        onChange={e => setRow(idx, 'percent', e.target.value)}
                        placeholder="0"
                        className="w-full pl-2.5 pr-6 py-1.5 border border-slate-200 rounded text-xs font-bold bg-white focus:outline-none focus:border-blue-400 text-right"
                      />
                      <span className="absolute right-2 top-1.5 text-slate-400 text-[10px] font-bold">%</span>
                    </div>
                    <span className="text-xs font-bold text-[#1e3a8a] min-w-[70px] text-right">
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
          <div className="bg-[#fafafa] border border-slate-200 rounded p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Total Percentage Allocated:</span>
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-bold',
                percentOk ? 'bg-green-600 text-white' : remaining > 0 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
              )}>
                {usedPercent.toFixed(1)}% / 100%
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  percentOk ? 'bg-green-600' : usedPercent > 100 ? 'bg-red-500' : 'bg-amber-400'
                )}
                style={{ width: `${Math.min(usedPercent, 100)}%` }}
              />
            </div>

            {!percentOk && (
              <p className="text-xs text-amber-700 font-bold flex items-center gap-1 pt-1">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                {remaining > 0
                  ? `Need ${remaining.toFixed(1)}% more to reach 100%. Click "Auto Balance" above!`
                  : `Over by ${Math.abs(remaining).toFixed(1)}%. Total must be exactly 100%.`}
              </p>
            )}
          </div>

          {/* Visual Schedule Preview */}
          <div className="bg-[#1e3a8a] text-white rounded p-4 space-y-3 border border-blue-900">
            <div className="flex items-center justify-between border-b border-blue-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-400" /> Payment Schedule Preview ({previewPrice} DKK order)
              </span>
              <span className="text-xs font-bold text-green-400">
                Total: {formatDKK(calcAmount(usedPercent, previewPrice))}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-white/10 p-2 rounded border border-white/10">
                <div>
                  <span className="font-bold text-white">1. Depositum (at checkout)</span>
                  <span className="text-[10px] text-blue-200 block">Immediate payment</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-300 text-sm">{form.downPaymentPercent || 0}%</span>
                  <span className="text-[11px] text-blue-100 block">{formatDKK(calcAmount(form.downPaymentPercent, previewPrice))}</span>
                </div>
              </div>

              {form.installments.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-white/10 p-2 rounded border border-white/10">
                  <div>
                    <span className="font-bold text-white">{r.label || `${i + 2}. rate`}</span>
                    <span className="text-[10px] text-blue-200 block">{r.dueLabel || 'Due date'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-200 text-sm">{r.percent || 0}%</span>
                    <span className="text-[11px] text-blue-100 block">{formatDKK(calcAmount(r.percent, previewPrice))}</span>
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
            {percentOk ? '✅ Ready to save' : '⚠️ Fix percentages to save'}
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
              disabled={saving || !percentOk}
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
          <p className="text-sm text-slate-500">Configure percentage-based payment plans for students</p>
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
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">Create your first percentage-based installment plan to allow students to pay in easy rates.</p>
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

                    {/* Down Payment % */}
                    <div className="col-span-3">
                      <span className="text-sm font-bold text-slate-800">{plan.downPaymentPercent}%</span>
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
                        Payment Schedule (% of student's total price)
                      </span>
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded px-4 py-2 text-xs">
                          <div>
                            <span className="font-bold text-slate-800">1. Depositum (at checkout)</span>
                            <span className="text-slate-400 block text-[10px]">Immediate payment</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[#1e3a8a] text-sm">{plan.downPaymentPercent}%</span>
                            <span className="text-[10px] text-slate-400 block">e.g. {Math.round(plan.downPaymentPercent / 100 * 2500)} DKK on 2.500 order</span>
                          </div>
                        </div>

                        {rows.map((row, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded px-4 py-2 text-xs">
                            <div>
                              <span className="font-bold text-slate-800">{row.label || `Rate ${idx + 2}`}</span>
                              {row.dueLabel && <span className="text-slate-400 block text-[10px]">{row.dueLabel}</span>}
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-800 text-sm">{row.percent}%</span>
                              <span className="text-[10px] text-slate-400 block">e.g. {Math.round((row.percent || 0) / 100 * 2500)} DKK on 2.500 order</span>
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
