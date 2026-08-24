import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, ShoppingCart, FileText } from "lucide-react";
import gold from '../assets/Student Life.jpg';
import { trackEvent } from "../utils/metaPixel";
import { pushEvent } from '../lib/tracking';

const SuccessScreen = ({ onContinueConfiguring, handleResetModal, onClose }) => {
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) return;

      const rawUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
      const apiRoot = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;

      try {
        const res = await fetch(
          `${apiRoot}/sendEmail/checkout-session?session_id=${sessionId}`
        );
        if (!res.ok) throw new Error("Kunne ikke hente ordredetaljer");
        const data = await res.json();
        setSession(data);
        
        if (data && data.amount_total) {
          trackEvent('Purchase', {
            value: data.amount_total / 100,
            currency: data.currency ? data.currency.toUpperCase() : 'DKK'
          });
          
          pushEvent('purchase_completed', {
            value: data.amount_total / 100,
            currency: data.currency ? data.currency.toUpperCase() : 'DKK',
            order_ref: data.metadata?.orderNumber || sessionId,
            email: data.customer_email || null,
            consentGiven: false
          }, 'gradcap_configurator');
        }
      } catch (err) {
        console.error("Error fetching checkout session:", err);
        setError(err.message);
      }
    };

    fetchSession();
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="max-w-lg w-full text-center">
          <p className="text-red-500 font-semibold text-lg mb-4">Der opstod en fejl</p>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            onClick={() => window.location.href = "https://studentlife.dk"}
            className="w-full py-3 bg-gray-950 text-white rounded-xl font-medium hover:bg-gray-800 transition duration-200"
          >
            Tilbage til butikken
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        <p className="text-gray-500 text-sm mt-4 font-medium">Henter dine ordredetaljer...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-white">
      <div className="max-w-xl w-full text-center">
        {/* Brand Logo */}
        <div className="flex justify-center mb-6">
          <img src={gold} alt="Student Life" className="h-14 w-auto object-contain" />
        </div>

        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-green-50 rounded-full">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tak for din bestilling!</h2>
        <p className="text-gray-600 text-sm mb-6">
          Vi har sendt en bekræftelsesmail til: <span className="font-semibold text-gray-800">{session.customer_email}</span>
        </p>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-xl p-5 mb-8 text-left border border-gray-100 text-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-500 font-medium flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-400" /> Ordrenummer
            </span>
            <span className="font-bold text-gray-900">
              {session.metadata?.orderNumber || "Under oprettelse"}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-500 font-medium">Samlet Betalt</span>
            <span className="font-bold text-gray-900">
              {session.amount_total / 100} {session.currency.toUpperCase()}
            </span>
          </div>

          <div>
            <span className="block text-gray-500 font-medium mb-2">Varer:</span>
            <ul className="space-y-1.5 pl-1">
              {session.line_items?.data.map((item) => (
                <li key={item.id} className="flex justify-between text-gray-700 text-xs">
                  <span>• {item.description}</span>
                  <span className="font-medium text-gray-500">x{item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              handleResetModal?.();
              window.location.href = "https://studentlife.dk";
              onClose?.();
            }}
            className="flex items-center justify-center px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition duration-200"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Fortsæt med at handle
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
