import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button, PasswordInput, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { resetPassword } from '../services/auth.service';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    if (!token || !email) {
      setErr('Invalid reset link. Please request a new password reset link.');
      return;
    }

    if (password.length < 8) {
      setErr('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, email, password);
      setIsSuccess(true);
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary bg-white">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">Reset Password</CardTitle>
          <CardDescription>
            {isSuccess
              ? 'Your password has been changed successfully.'
              : `Create a new password for ${email || 'your account'}`}
          </CardDescription>
        </CardHeader>

        {isSuccess ? (
          <CardContent className="space-y-4">
            <div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-md border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Password updated successfully!</p>
                <p className="text-xs text-emerald-700 mt-1">You can now sign in using your new password.</p>
              </div>
            </div>
            <Button
              className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold"
              onClick={() => navigate('/login')}
            >
              Go to Sign In
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {(!token || !email) && (
                <div className="p-3 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Missing token or email. Please open the link directly from your email.</span>
                </div>
              )}

              {err && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 font-medium">
                  {err}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="new-password">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <PasswordInput
                    id="new-password"
                    placeholder="At least 8 characters"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="confirm-password">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <PasswordInput
                    id="confirm-password"
                    placeholder="Repeat password"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-2">
              <Button
                className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold py-2.5"
                type="submit"
                disabled={isLoading || !token || !email}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  'Save New Password'
                )}
              </Button>
              <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800 mt-2 font-medium">
                Back to Sign In
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
