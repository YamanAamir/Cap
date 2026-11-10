import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, PasswordInput, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui';
import { Lock, Mail, Loader2, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';
import { forgotPassword as requestForgotPassword } from '../services/auth.service';

const LoginPage = () => {
  // Modes: 'login' | '2fa' | 'forgot'
  const [view, setView] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2FA state
  const [mfaToken, setMfaToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const { login, verify2fa } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setInfo('');
    setIsLoading(true);
    try {
      localStorage.removeItem('cap_dashboard_mode');
      const res = await login(email, password);
      if (res.requires2FA) {
        setMfaToken(res.mfaToken);
        setView('2fa');
        setTotpCode('');
        setUseBackupCode(false);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      setErr(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2faSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setIsLoading(true);
    try {
      await verify2fa(mfaToken, totpCode);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErr(error.response?.data?.message || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setIsLoading(true);
    try {
      await requestForgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary bg-white">
        {/* VIEW 1: LOGIN */}
        {view === 'login' && (
          <>
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight text-slate-800">Admin Dashboard</CardTitle>
              <CardDescription>Enter your credentials to access the management panel</CardDescription>
            </CardHeader>
            <form onSubmit={handleLoginSubmit}>
              <CardContent className="space-y-4">
                {err && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 font-medium">
                    {err}
                  </div>
                )}
                {info && (
                  <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-200 font-medium">
                    {info}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotSent(false);
                        setErr('');
                        setView('forgot');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                    <PasswordInput
                      id="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold py-2.5" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </CardFooter>
            </form>
          </>
        )}

        {/* VIEW 2: 2FA VERIFICATION */}
        {view === '2fa' && (
          <>
            <CardHeader className="space-y-2 text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">Two-Factor Authentication</CardTitle>
              <CardDescription>
                {useBackupCode
                  ? 'Enter one of your 10-character emergency backup codes.'
                  : 'Enter the 6-digit code generated by your Authenticator app.'}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handle2faSubmit}>
              <CardContent className="space-y-4">
                {err && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 font-medium">
                    {err}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="totp">
                    {useBackupCode ? 'Backup Code' : '6-digit Authenticator Code'}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                    <Input
                      id="totp"
                      type="text"
                      inputMode={useBackupCode ? 'text' : 'numeric'}
                      autoFocus
                      placeholder={useBackupCode ? 'XXXXX-XXXXX' : '123456'}
                      className="pl-10 text-center tracking-widest font-mono text-lg font-bold"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      required
                      autoComplete="one-time-code"
                      maxLength={useBackupCode ? 15 : 8}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(!useBackupCode);
                      setTotpCode('');
                      setErr('');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {useBackupCode ? 'Use authenticator code instead' : 'Lost device? Use a backup code'}
                  </button>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold py-2.5" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Sign In'
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setErr('');
                    setTotpCode('');
                  }}
                  className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 mt-2 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to email & password
                </button>
              </CardFooter>
            </form>
          </>
        )}

        {/* VIEW 3: FORGOT PASSWORD */}
        {view === 'forgot' && (
          <>
            <CardHeader className="space-y-2 text-center">
              <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">Forgot Password</CardTitle>
              <CardDescription>
                Enter your account email and we'll send you a secure link to reset your password.
              </CardDescription>
            </CardHeader>
            {forgotSent ? (
              <CardContent className="space-y-4">
                <div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-md border border-emerald-200">
                  <p className="font-semibold mb-1">Check your inbox</p>
                  <p>
                    If an account with <strong>{forgotEmail}</strong> exists, a password reset link has been emailed to you.
                    The link expires in <strong>30 minutes</strong>.
                  </p>
                </div>
                <Button
                  className="w-full bg-[#1e3a8a] text-white hover:bg-blue-800 font-bold"
                  onClick={() => {
                    setView('login');
                    setForgotSent(false);
                  }}
                >
                  Back to Sign In
                </Button>
              </CardContent>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <CardContent className="space-y-4">
                  {err && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 font-medium">
                      {err}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="forgot-email">Account Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="admin@example.com"
                        className="pl-10"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold py-2.5" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending reset link...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      setErr('');
                    }}
                    className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 mt-2 font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
                  </button>
                </CardFooter>
              </form>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;
