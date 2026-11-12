import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Loader2, Send, CreditCard, ExternalLink } from 'lucide-react';
import { sendInstallmentPaymentLink } from '../../services/auth.service';
import toast from 'react-hot-toast';

const SendInstallmentLinkModal = ({
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
  const sendingRef = React.useRef(false);

  useEffect(() => {
    setRecipientEmail(defaultEmail);
    setError(null);
    sendingRef.current = false;
  }, [isOpen, order, installment, defaultEmail]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (sendingRef.current || sending) return;
    if (!recipientEmail || !recipientEmail.trim() || !recipientEmail.includes('@')) {
      setError('Indtast venligst en gyldig modtager e-mailadresse.');
      return;
    }

    sendingRef.current = true;
    setSending(true);
    setError(null);

    try {
      const res = await sendInstallmentPaymentLink(order.id, {
        installmentIndex,
        recipientEmail: recipientEmail.trim()
      });

      const msg = res?.message || `Betalingslink for ${installment.label || `Rate ${installmentIndex + 1}`} er sendt til ${recipientEmail.trim()}`;
      toast.success(msg);

      if (onSuccess) {
        onSuccess(msg);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Fejl under afsendelse af betalingslink';
      setError(msg);
      toast.error(msg);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Send Payment Link E-mail
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
        <form onSubmit={handleSend} className="p-5 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Rate:</span>
              <strong className="text-slate-900">{installment.label || `Rate ${installmentIndex + 1}`}</strong>
            </div>
            <div className="flex justify-between">
              <span>Beløb til betaling:</span>
              <strong className="text-indigo-700 text-sm">{installment.amount} DKK</strong>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-amber-700 font-medium">{installment.status || 'Pending'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Modtager E-mailadresse
            </label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              placeholder="kunde@studentlife.dk"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Du kan ændre e-mailadressen her hvis kunden ønsker linket sendt til en anden adresse.
            </p>
          </div>

          <div className="p-2.5 bg-indigo-50/70 rounded-lg border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
            📧 Kunden modtager en flot e-mail med en oversigt over deres afdragsordning og en <strong>"Betal din rate nu"</strong>-knap, der fører direkte til sikker betaling via Frisbii / Flatpay.
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
              disabled={sending}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg font-medium"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-sm"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Payment Link
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default SendInstallmentLinkModal;

