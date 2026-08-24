import React from "react";
import { XCircle, ShoppingCart, RefreshCw } from "lucide-react";

const CancelScreen = ({ handleResetModal, onClose }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-white">
      <div className="max-w-lg w-full text-center">
        {/* Cancel Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-50 rounded-full">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Betaling annulleret
        </h2>
        
        {/* Description */}
        <p className="text-gray-600 mb-8 text-sm sm:text-base leading-relaxed">
          Din betaling blev desværre ikke gennemført. Hvis dette var en fejl, kan du prøve at gennemføre betalingen igen, eller gå tilbage til vores butik for at fortsætte med at handle.
        </p>

        {/* Actions */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              handleResetModal?.();
              window.location.href = "https://studentlife.dk";
              onClose?.();
            }}
            className="flex items-center justify-center px-8 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition duration-200"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Tilbage til butikken
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelScreen;
