import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, Smartphone, Plus, Trash2, KeyRound,
  History, Loader2, Copy, Check, Eye, EyeOff, AlertTriangle, Lock
} from 'lucide-react';
import {
  get2faStatus, setup2fa, verify2faSetup, remove2faDevice,
  disable2fa, regenerateBackupCodes, getMyLoginHistory
} from '../services/auth.service';
import { Button, PasswordInput } from '../components/ui';
import toast from 'react-hot-toast';

const Security2faPage = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ enabled: false, authenticators: [], backupCodesRemaining: 0 });
  const [loginHistory, setLoginHistory] = useState([]);

  // Setup modal
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [deviceName, setDeviceName] = useState('');
  const [setupData, setSetupData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState(null);

  // Remove device modal
  const [removeModal, setRemoveModal] = useState({ isOpen: false, device: null, password: '' });
  const [removeLoading, setRemoveLoading] = useState(false);

  // Disable 2FA modal
  const [disableModal, setDisableModal] = useState({ isOpen: false, password: '', code: '' });
  const [disableLoading, setDisableLoading] = useState(false);

  // Backup codes modal
  const [backupModal, setBackupModal] = useState({ isOpen: false, password: '', codes: null });
  const [backupLoading, setBackupLoading] = useState(false);

  const [copiedKey, setCopiedKey] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [st, lh] = await Promise.all([get2faStatus(), getMyLoginHistory()]);
      setStatus(st);
      setLoginHistory(lh || []);
    } catch (e) {
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartSetup = async () => {
    setSetupLoading(true);
    try {
      const data = await setup2fa(deviceName || 'My Authenticator');
      setSetupData(data);
      setSetupStep(2);
      setVerifyCode('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start 2FA setup');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleConfirmSetup = async (e) => {
    e.preventDefault();
    setSetupLoading(true);
    try {
      const res = await verify2faSetup(setupData.id, verifyCode);
      toast.success('Authenticator device added successfully!');
      if (res.backupCodes) {
        setNewBackupCodes(res.backupCodes);
        setSetupStep(3);
      } else {
        setShowSetupModal(false);
        loadData();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid verification code');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleRemoveDevice = async (e) => {
    e.preventDefault();
    setRemoveLoading(true);
    try {
      await remove2faDevice(removeModal.device.id, removeModal.password);
      toast.success('Authenticator device removed');
      setRemoveModal({ isOpen: false, device: null, password: '' });
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to remove device');
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleDisable2fa = async (e) => {
    e.preventDefault();
    setDisableLoading(true);
    try {
      await disable2fa(disableModal.password, disableModal.code);
      toast.success('Two-factor authentication disabled');
      setDisableModal({ isOpen: false, password: '', code: '' });
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setDisableLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async (e) => {
    e.preventDefault();
    setBackupLoading(true);
    try {
      const res = await regenerateBackupCodes(backupModal.password);
      setBackupModal({ ...backupModal, codes: res.backupCodes, password: '' });
      toast.success('New backup codes generated');
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate backup codes');
    } finally {
      setBackupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1100px] mx-auto pb-16 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            Security & Two-Factor Authentication
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Protect your admin account with multi-device authenticator apps (Google Authenticator, Authy, Microsoft Authenticator) and review recent login history.
          </p>
        </div>

        {status.enabled && (
          <button
            onClick={() => setDisableModal({ isOpen: true, password: '', code: '' })}
            className="text-xs font-semibold text-red-600 hover:text-red-800 px-3 py-1.5 border border-red-200 hover:border-red-300 rounded bg-red-50 transition"
          >
            Disable 2FA
          </button>
        )}
      </div>

      {/* 2FA Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${status.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {status.enabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {status.enabled ? 'Two-Factor Authentication is Enabled' : 'Two-Factor Authentication is Not Enabled'}
                </h3>
                <p className="text-xs text-slate-500">
                  {status.enabled
                    ? `${status.authenticators.length} active authenticator device(s) configured.`
                    : 'Add an authenticator app to require a 6-digit code on every sign-in.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setDeviceName('');
                setSetupStep(1);
                setShowSetupModal(true);
              }}
              className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Authenticator
            </button>
          </div>

          {/* Connected Devices List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Connected Authenticator Apps (Multi-Device)
            </h4>

            {status.authenticators.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-sm">
                No authenticator apps configured yet. Click "Add Authenticator" to connect your phone.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                {status.authenticators.map((dev) => (
                  <div key={dev.id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{dev.name}</p>
                        <p className="text-xs text-slate-400">
                          Added {new Date(dev.createdAt).toLocaleDateString()}
                          {dev.lastUsedAt && ` • Last used ${new Date(dev.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setRemoveModal({ isOpen: true, device: dev, password: '' })}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded transition"
                      title="Remove device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Backup Codes Side Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-800 font-bold">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <span>Emergency Backup Codes</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Backup codes let you sign in if you lose access to your authenticator app. Each code can be used once.
            </p>

            <div className="bg-indigo-50 border border-indigo-100 rounded p-3 text-xs text-indigo-900">
              <span className="font-bold text-lg block text-indigo-700">{status.backupCodesRemaining}</span>
              <span>remaining valid backup codes</span>
            </div>
          </div>

          <button
            onClick={() => setBackupModal({ isOpen: true, password: '', codes: null })}
            disabled={!status.enabled}
            className="w-full text-xs font-bold py-2 px-3 border border-slate-200 hover:border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Regenerate Backup Codes
          </button>
        </div>
      </div>

      {/* Login History Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">My Recent Sign-Ins</h3>
          </div>
          <span className="text-xs text-slate-400">Last 50 login attempts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Device / Browser</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loginHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No sign-in records yet.
                  </td>
                </tr>
              ) : (
                loginHistory.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] ${row.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {row.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {row.ip || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {row.device} • {row.browser} on {row.os}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {row.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: SETUP AUTHENTICATOR (STEP 1 & 2) ─── */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <h3 className="text-lg font-bold text-slate-800">
              {setupStep === 1 && 'Name Your Device'}
              {setupStep === 2 && 'Scan QR Code'}
              {setupStep === 3 && 'Save Your Backup Codes'}
            </h3>

            {setupStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Give this device a label so you can recognize it (e.g., "Personal iPhone", "Work Pixel", "1Password").
                </p>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Device Label</label>
                  <input
                    type="text"
                    placeholder="e.g. iPhone 15"
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowSetupModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleStartSetup}
                    disabled={setupLoading}
                    className="bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold px-4 py-2"
                  >
                    {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
                  </Button>
                </div>
              </div>
            )}

            {setupStep === 2 && setupData && (
              <form onSubmit={handleConfirmSetup} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Scan this QR code with <strong>Google Authenticator</strong>, <strong>Authy</strong>, or your password manager.
                </p>

                <div className="flex justify-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <img src={setupData.qrDataUrl} alt="2FA QR Code" className="w-48 h-48" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Or enter key manually:</span>
                  <div className="flex items-center justify-between p-2 bg-slate-100 rounded font-mono text-xs text-slate-800 font-bold select-all">
                    <span>{setupData.secret}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(setupData.secret);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="text-blue-600 hover:text-blue-800 ml-2"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Enter 6-Digit Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="w-full px-3 py-2 border border-slate-200 rounded text-center tracking-widest font-mono text-lg font-bold focus:outline-none focus:border-blue-500"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSetupStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Back
                  </button>
                  <Button
                    type="submit"
                    disabled={setupLoading || verifyCode.length < 6}
                    className="bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold px-4 py-2"
                  >
                    {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Enable'}
                  </Button>
                </div>
              </form>
            )}

            {setupStep === 3 && newBackupCodes && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Save these backup codes now! They will not be shown again. Each code can be used once if you lose your phone.</span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-800 text-center">
                  {newBackupCodes.map((c, i) => (
                    <div key={i} className="p-1.5 bg-white rounded border border-slate-100">
                      {c}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newBackupCodes.join('\n'));
                      toast.success('Backup codes copied to clipboard');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy all codes
                  </button>
                  <Button
                    onClick={() => {
                      setShowSetupModal(false);
                      setNewBackupCodes(null);
                      loadData();
                    }}
                    className="bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold px-4 py-2"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: REMOVE DEVICE ─── */}
      {removeModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleRemoveDevice} className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Remove Authenticator Device?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove <strong>{removeModal.device?.name}</strong>? Please enter your current account password to confirm.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Your Password</label>
              <PasswordInput
                placeholder="••••••••"
                value={removeModal.password}
                onChange={(e) => setRemoveModal({ ...removeModal, password: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRemoveModal({ isOpen: false, device: null, password: '' })}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={removeLoading || !removeModal.password}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded"
              >
                {removeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove Device'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: DISABLE 2FA ─── */}
      {disableModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleDisable2fa} className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Disable Two-Factor Authentication</h3>
            <p className="text-xs text-slate-500">
              This will remove all authenticators and recovery codes. Please confirm with your password and a 6-digit code.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
              <PasswordInput
                placeholder="••••••••"
                value={disableModal.password}
                onChange={(e) => setDisableModal({ ...disableModal, password: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">6-Digit Code or Backup Code</label>
              <input
                type="text"
                placeholder="123456"
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm text-center font-mono font-bold"
                value={disableModal.code}
                onChange={(e) => setDisableModal({ ...disableModal, code: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDisableModal({ isOpen: false, password: '', code: '' })}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disableLoading || !disableModal.password || !disableModal.code}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded"
              >
                {disableLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disable 2FA'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: REGENERATE BACKUP CODES ─── */}
      {backupModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800">
              {backupModal.codes ? 'New Backup Codes' : 'Regenerate Backup Codes'}
            </h3>

            {backupModal.codes ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Your previous backup codes have been invalidated. Save these new ones safely:
                </p>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-800 text-center">
                  {backupModal.codes.map((c, i) => (
                    <div key={i} className="p-1.5 bg-white rounded border border-slate-100">
                      {c}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(backupModal.codes.join('\n'));
                      toast.success('Codes copied');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy all
                  </button>
                  <Button
                    onClick={() => setBackupModal({ isOpen: false, password: '', codes: null })}
                    className="bg-[#1e3a8a] text-white text-xs font-bold px-4 py-2"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegenerateBackupCodes} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Please enter your password to generate a fresh set of 8 emergency backup codes.
                </p>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Your Password</label>
                  <PasswordInput
                    placeholder="••••••••"
                    value={backupModal.password}
                    onChange={(e) => setBackupModal({ ...backupModal, password: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBackupModal({ isOpen: false, password: '', codes: null })}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={backupLoading || !backupModal.password}
                    className="bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold px-4 py-2"
                  >
                    {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Codes'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Security2faPage;
