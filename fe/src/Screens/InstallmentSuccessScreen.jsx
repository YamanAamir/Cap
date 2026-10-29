import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, Clock, ShoppingCart, FileText, CreditCard } from "lucide-react";

const InstallmentSuccessScreen = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orderId = searchParams.get("order_id") || searchParams.get("orderId");
  const installmentIndex = searchParams.get("installment_index") || searchParams.get("installmentIndex");
  const sessionId = searchParams.get("session_id") || searchParams.get("id") || searchParams.get("invoice");
  const isAlreadyPaid = searchParams.get("status") === "already_paid";

  useEffect(() => {
    const fetchStatus = async () => {
      const rawUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const apiRoot = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;

      try {
        const queryParams = new URLSearchParams();
        if (orderId) queryParams.append("order_id", orderId);
        if (installmentIndex !== null && installmentIndex !== undefined) {
          queryParams.append("installment_index", installmentIndex);
        }
        if (sessionId) queryParams.append("session_id", sessionId);

        const res = await fetch(`${apiRoot}/sendEmail/installment-status?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error("Kunne ikke hente afdragsstatus for ordren.");
        }
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.message || "Fejl ved indlæsning af rateoplysninger.");
        }
        setData(json);
      } catch (err) {
        console.error("Error fetching installment status:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [orderId, installmentIndex, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="text-gray-500 text-sm mt-4 font-medium">Henter din ratebetaling...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="max-w-lg w-full text-center">
          <p className="text-red-500 font-semibold text-lg mb-3">Der opstod en fejl</p>
          <p className="text-gray-600 mb-6 text-sm">{error || "Ordredetaljer kunne ikke findes."}</p>
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

  const {
    orderNumber,
    customerEmail,
    customerName,
    totalPrice,
    totalPaid,
    remainingAmount,
    currentInstallment,
    installments = []
  } = data;

  const isFullyPaid = remainingAmount <= 0;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-white">
      <div className="max-w-xl w-full text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-green-50 rounded-full">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isAlreadyPaid
            ? "Raten er allerede betalt"
            : isFullyPaid
              ? "Tillykke! Din afdragsordning er færdigbetalt! 🎉"
              : "Tak for din ratebetaling!"}
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          {isAlreadyPaid
            ? `Denne rate for ordre #${orderNumber} er allerede registreret som betalt.`
            : `Vi har registreret din betaling for ordre #${orderNumber} og sendt en bekræftelse til:`}{" "}
          <span className="font-semibold text-gray-800">{customerEmail}</span>
        </p>

        {/* Current Installment Info */}
        {currentInstallment && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">
                Gennemført Betaling
              </span>
              <div className="text-lg font-bold text-gray-900 mt-0.5">
                {currentInstallment.label || "Ratebetaling"}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-green-700">
                {currentInstallment.amount} DKK
              </span>
              <span className="block text-xs font-semibold text-green-600">✓ Betalt</span>
            </div>
          </div>
        )}

        {/* Order Details & Installment History */}
        <div className="bg-gray-50 rounded-xl p-5 mb-8 text-left border border-gray-100 text-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-500 font-medium flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-400" /> Ordrenummer
            </span>
            <span className="font-bold text-gray-900">#{orderNumber}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-500 font-medium flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-gray-400" /> Samlet Betalt indtil nu
            </span>
            <span className="font-bold text-green-600">
              {totalPaid} DKK
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-500 font-medium">Resterende beløb</span>
            <span className={`font-bold ${isFullyPaid ? 'text-green-600' : 'text-gray-900'}`}>
              {isFullyPaid ? "0 DKK (Færdigbetalt)" : `${remainingAmount} DKK`}
            </span>
          </div>

          {/* Installment Plan Breakdown */}
          {installments.length > 0 && (
            <div className="pt-2">
              <span className="block text-gray-700 font-semibold mb-3">
                Oversigt over dine rater:
              </span>
              <div className="space-y-2">
                {installments.map((inst, index) => {
                  const isPaid = inst.status === "Paid";
                  return (
                    <div
                      key={index}
                      className={`flex justify-between items-center p-3 rounded-lg border text-xs sm:text-sm ${
                        isPaid
                          ? "bg-white border-green-200 text-gray-900"
                          : "bg-gray-100 border-gray-200 text-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isPaid ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-medium">
                            {inst.label || `${index + 1}. rate`}
                          </span>
                          {inst.paidAt && (
                            <span className="block text-xs text-gray-400">
                              Betalt: {new Date(inst.paidAt).toLocaleDateString("da-DK")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{inst.amount} DKK</span>
                        <span
                          className={`block text-[11px] font-semibold ${
                            isPaid ? "text-green-600" : "text-amber-600"
                          }`}
                        >
                          {isPaid ? "Betalt" : "Afventer"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              window.location.href = "https://studentlife.dk";
            }}
            className="flex items-center justify-center px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition duration-200 w-full sm:w-auto"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Tilbage til butikken
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallmentSuccessScreen;

