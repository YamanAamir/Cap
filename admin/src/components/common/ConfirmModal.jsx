import React from 'react';
import { AlertTriangle, HelpCircle, RefreshCw, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'Do you really want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary', // 'danger' | 'primary' | 'warning'
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-5 transform transition-all scale-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl flex items-center justify-center ${
                isDanger ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-[#1e3a8a] border border-blue-100'
              }`}
            >
              {isDanger ? <AlertTriangle className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{title}</h3>
              <p className="text-xs text-slate-500 font-medium">Confirmation Required</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed font-normal">{message}</p>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500'
                : 'bg-[#1e3a8a] hover:bg-blue-900 focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
