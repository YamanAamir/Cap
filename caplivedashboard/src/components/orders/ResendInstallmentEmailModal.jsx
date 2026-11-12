import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { resendInstallmentEmail } from '../../services/auth.service';

const ResendInstallmentEmailModal = ({
  isOpen,
  onClose,
  order,
  installment,
  installmentIndex,
  onSuccess
}) => {
  if (!isOpen || !order || !installment) return null;

  const defaultEmail = order.customerEmail || order.customer?.email || '';
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    setRecipientEmail(defaultEmail);
    setError(null);
    setSuccessMessage(null);
  }, [order, installment, defaultEmail]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!recipientEmail || !recipientEmail.trim() || !recipientEmail.includes('@')) {
      setError('Indtast venligst en gyldig modtager e-mailadresse.');
      return;
    }

    setSending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await resendInstallmentEmail(order.id, {
        installmentIndex,
        recipientEmail: recipientEmail.trim()
      });

      const msg = res?.message || `Kvittering for ${installment.label || `Rate ${installmentIndex + 1}`} er sendt til ${recipientEmail.trim()}`;
      setSuccessMessage(msg);

      if (onSuccess) {
        onSuccess(msg);
      }

      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to resend installment confirmation email:', err);
      const msg = err.response?.data?.message || err.message || 'Der opstod en fejl under afsendelse af kvitteringen.';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Resend Payment Success Email</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Send the official payment receipt for {installment.label || `Rate ${installmentIndex + 1}`}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            disabled={sending}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSend} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Status Messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* Installment Summary Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Order Number:</span>
              <span className="font-mono font-bold text-slate-800">#{order.orderNumber}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Installment Rate:</span>
              <span className="font-bold text-slate-800">{installment.label || `Rate ${installmentIndex + 1}`}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Amount Paid:</span>
              <span className="font-bold text-emerald-700 text-sm">{installment.amount} DKK</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-200">
              <span>Payment Status:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <Check className="w-3 h-3" /> PAID
              </span>
            </div>
          </div>

          {/* Editable Recipient Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Recipient Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Indtast modtager e-mail..."
                disabled={sending}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-medium transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Auto-filled with the customer's email. You can edit this address to resend the payment confirmation receipt to a different email.
            </p>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !recipientEmail.trim()}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending Receipt...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Payment Success Email</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ResendInstallmentEmailModal;

