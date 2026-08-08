import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submitSmsSignup } from '../services/marketing.api';
import { Loader2, Smartphone, Gift, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

const SmsSignupScreen = () => {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const [form, setForm] = useState({ name: '', email: '', phone: '', gdprConsent: false });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await submitSmsSignup({
        name: form.name,
        email: form.email,
        phone: form.phone,
        gdprConsent: form.gdprConsent,
        campaignId: campaignId ? parseInt(campaignId) : undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded shadow-sm border border-slate-200 p-8 text-center animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-[#f0f8f1] rounded flex items-center justify-center mx-auto mb-6 border border-green-100">
            <CheckCircle2 className="h-8 w-8 text-[#2d6a4f]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tillykke!</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            {result.alreadyRegistered
              ? 'Du er allerede tilmeldt SMS-marketing.'
              : 'Du er nu tilmeldt SMS-marketing.'}
          </p>
          {result.discountCode && (
            <div className="mt-8 p-6 bg-slate-50 rounded border border-slate-200 border-dashed">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2 mb-2">
                <Gift className="h-4 w-4" /> DIN EKSKLUSIVE RABATKODE
              </p>
              <p className="text-sm text-slate-600 mb-4">Dit telefonnummer er nu din rabatkode!</p>
              <div className="bg-white px-6 py-4 rounded border border-slate-200 inline-block shadow-sm">
                <p className="text-3xl font-black text-[#1e3a8a] tracking-widest">{result.discountCode.code}</p>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-wider">
                GYLDIG TIL {new Date(result.discountCode.expiresAt).toLocaleDateString('da-DK')}
              </p>
            </div>
          )}
          <a
            href="/"
            className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-[#1e3a8a] text-white font-bold rounded shadow-sm hover:bg-blue-800 transition-colors"
          >
            DESIGN DIN STUDENTERHUE nu <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 text-center bg-[#fafafa]">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Smartphone className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Få SMS-tilbud & rabat</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Tilmeld dig og modtag en eksklusiv rabatkode til din studenterhue.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Navn</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-bold text-slate-800 transition-shadow bg-[#fafafa] focus:bg-white"
              placeholder="Dit fulde navn"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-bold text-slate-800 transition-shadow bg-[#fafafa] focus:bg-white"
              placeholder="din@email.dk"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Telefon</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">+</span>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '') })}
                className="w-full pl-8 pr-4 py-3 rounded border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-bold text-slate-800 transition-shadow bg-[#fafafa] focus:bg-white"
                placeholder="45 12 34 56 78"
                disabled={loading}
              />
            </div>
          </div>

          <label className={`flex items-start gap-3 cursor-pointer p-4 rounded border transition-colors ${
            form.gdprConsent ? "bg-blue-50/50 border-blue-200" : "bg-[#fafafa] border-slate-200 hover:bg-slate-50"
          }`}>
            <input
              type="checkbox"
              required
              checked={form.gdprConsent}
              onChange={(e) => setForm({ ...form, gdprConsent: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              disabled={loading}
            />
            <div>
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-blue-600" /> GDPR Samtykke
              </p>
              <span className="text-[11px] text-slate-500 leading-relaxed font-medium block">
                Jeg giver samtykke til at modtage SMS-marketing fra StudentLife. Jeg kan til enhver tid afmelde ved at sende STOP.
              </span>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading || !form.gdprConsent}
            className="w-full py-3.5 bg-[#7cb342] hover:bg-[#689f38] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> BEHANDLER...
              </>
            ) : (
              <>TILMELD & FÅ RABATKODE</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SmsSignupScreen;
