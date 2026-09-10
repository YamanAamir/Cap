import React, { useState } from 'react';
import { Mail, User, ShieldCheck, Building2, Check, X, Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { resendOrderEmails } from '../../services/auth.service';

const SendOrderEmailsModal = ({ isOpen, onClose, order, onSuccess }) => {
  if (!isOpen || !order) return null;

  const [recipients, setRecipients] = useState({
    customer: true,
    admin: true,
    factory: true,
  });

  const [customCustomerEmail, setCustomCustomerEmail] = useState('');
  const [showCustomerInput, setShowCustomerInput] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const customerEmail = order.customerEmail || order.customer?.email || 'Ingen email fundet';

  const toggleRecipient = (key) => {
    setRecipients(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const selectedCount = Object.values(recipients).filter(Boolean).length;
  const allSelected = selectedCount === 3;

  const toggleSelectAll = () => {
    const nextState = !allSelected;
    setRecipients({
      customer: nextState,
      admin: nextState,
      factory: nextState,
    });
  };

  const handleSend = async () => {
    if (selectedCount === 0) return;
    setSending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        sendToCustomer: recipients.customer,
        sendToAdmin: recipients.admin,
        sendToFactory: recipients.factory,
        customCustomerEmail: (showCustomerInput && customCustomerEmail.trim()) ? customCustomerEmail.trim() : undefined,
      };

      const res = await resendOrderEmails(order.id, payload);
      setSuccessMessage(res?.message || 'Emails blev sendt med succes!');
      
      if (onSuccess) {
        onSuccess(res);
      }

      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1200);

    } catch (err) {
      console.error('Failed to send order emails:', err);
      const msg = err.response?.data?.message || err.message || 'Der opstod en fejl under afsendelse af emails.';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-white">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">Send Ordre-emails</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  #{order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vælg hvilke modtagere der skal modtage ordrebekræftelse og specifikationer
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={sending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Quick toggle bar */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Modtagerliste ({selectedCount} af 3 valgt)
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={sending}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-all"
            >
              {allSelected ? 'Fravælg alle' : 'Vælg alle'}
            </button>
          </div>

          {/* Recipient 1: Customer */}
          <div 
            onClick={() => !sending && toggleRecipient('customer')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
              recipients.customer 
                ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' 
                : 'border-slate-200 hover:border-slate-300 bg-white opacity-70'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  recipients.customer ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">1. Kunde (Customer)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Ordrebekræftelse
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Kunde-ordrebekræftelse indeholdende 3D-kasket gengivelser, tilvalg, valgt pakke og leveringsdetaljer.
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Modtager: {customerEmail}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCustomerInput(!showCustomerInput);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      {showCustomerInput ? 'Skjul tilpasset email' : 'Tilpas email'}
                    </button>
                  </div>
                  {showCustomerInput && (
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="email"
                        placeholder="Skriv alternativ kunde-email..."
                        value={customCustomerEmail}
                        onChange={(e) => setCustomCustomerEmail(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                recipients.customer ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {recipients.customer && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Recipient 2: Admin */}
          <div 
            onClick={() => !sending && toggleRecipient('admin')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
              recipients.admin 
                ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' 
                : 'border-slate-200 hover:border-slate-300 bg-white opacity-70'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  recipients.admin ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">2. Administration (Admin Copy)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Intern Kopi
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Fuld administrativ dossier-rapport med alle kundedetaljer, uddannelsesretning, betalingsoplysninger og specifikationer.
                  </p>
                  <div className="mt-2">
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Modtager: salg@studentlife.dk
                    </span>
                  </div>
                </div>
              </div>

              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                recipients.admin ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {recipients.admin && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Recipient 3: Factory */}
          <div 
            onClick={() => !sending && toggleRecipient('factory')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
              recipients.factory 
                ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' 
                : 'border-slate-200 hover:border-slate-300 bg-white opacity-70'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  recipients.factory ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">3. Fabrik / Produktion (Factory Sheet)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Produktionsark
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Teknisk arbejdsark med specifikke broderikoder, indvendigt foer, kokarder, skyggemål og produktionsparametre.
                  </p>
                  <div className="mt-2">
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Modtager: Fabrik / salg@studentlife.dk
                    </span>
                  </div>
                </div>
              </div>

              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                recipients.factory ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {recipients.factory && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {selectedCount === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Vælg mindst én modtager for at kunne afsende emails.</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            {selectedCount > 0 ? `${selectedCount} af 3 valgt` : 'Ingen modtagere valgt'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Annuller
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || selectedCount === 0}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition-all ${
                sending || selectedCount === 0
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20 active:scale-[0.98]'
              }`}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sender...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send {selectedCount > 0 ? `(${selectedCount}) Emails` : 'Emails'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SendOrderEmailsModal;
