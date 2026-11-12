import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, Loader2, Calendar } from 'lucide-react';
import { markInstallmentPaid } from '../../services/auth.service';
import toast from 'react-hot-toast';

const MarkInstallmentPaidModal = ({
  isOpen,
  onClose,
  order,
  installment,
  installmentIndex,
  onSuccess
}) => {
  if (!isOpen || !order || !installment) return null;

  // Default to today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [paidDate, setPaidDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPaidDate(todayStr);
    setError(null);
  }, [isOpen, order, installment]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await markInstallmentPaid(order.id, {
        installmentIndex,
        paidAt: paidDate ? new Date(`${paidDate}T12:00:00.000Z`).toISOString() : new Date().toISOString(),
        status: 'Paid'
      });

      toast.success(res?.message || `${installment.label || `Rate ${installmentIndex + 1}`} er markeret som Betalt`);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Fejl under opdatering af rate';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Marker Rate som Betalt
              </h3>
              <p className="text-xs text-slate-500">
                Ordre #{order.orderNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Rate:</span>
              <strong className="text-slate-900">{installment.label || `Rate ${installmentIndex + 1}`}</strong>
            </div>
            <div className="flex justify-between">
              <span>Beløb:</span>
              <strong className="text-slate-900">{installment.amount} DKK</strong>
            </div>
            <div className="flex justify-between">
              <span>Nuværende Status:</span>
              <span className="text-amber-700 font-medium">{installment.status || 'Pending'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Betalingsdato
            </label>
            <input
              type="date"
              required
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Vælg datoen hvor kunden betalte denne rate (f.eks. 09-11-2026).
            </p>
          </div>

          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
            ℹ️ Denne handling opdaterer kun ordrestatus til <strong>Betalt</strong> i databasen. Der sendes <strong>ikke</strong> automatisk en e-mail. Du kan efterfølgende gensende kvitteringsmailen hvis ønsket.
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg text-xs border border-rose-200">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg font-medium"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Gem som Betalt
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default MarkInstallmentPaidModal;

