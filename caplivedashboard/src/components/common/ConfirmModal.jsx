import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  onConfirm, 
  onCancel, 
  isLoading = false,
  isDestructive = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#fafafa]">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          </div>
          <button 
            onClick={onCancel} 
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-[#fafafa] border-t border-slate-100 flex items-center justify-end gap-3">
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2 rounded text-sm font-bold text-white shadow-sm transition-colors disabled:opacity-70 ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-[#1e3a8a] hover:bg-blue-800'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;
