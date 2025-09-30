import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ModernButton } from '@/components/ui';
import { AppInput } from '@/components/ui/AppInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const featureHighlights = [
    'Track student attendance and activities in real time',
    'Automate tuition reminders and payment follow-ups',
    'Coordinate teachers, schedules, and resources instantly'
  ];
  
  // Check for success message from signup
  const successMessage = location.state?.message;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'super_admin') {
        navigate('/super-admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email/phone and password');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setError('Invalid credentials. Please check your email/phone and password');
    }
    // Redirect will be handled by the useEffect above
  };



  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-purple-50/40 to-blue-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <div className="relative hidden flex-col justify-between bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-500 p-12 text-white lg:flex">
            <div className="absolute inset-0 opacity-10">
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.6)_0%,_transparent_55%)]" />
            </div>

            <div className="relative z-10">
              <div className="mb-10 flex items-center gap-3">
                <img src="/favicon.svg" alt="Scolink logo" className="h-14 w-14" />
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/70">Welcome Back</p>
                  <h2 className="text-2xl font-semibold">Scolink Platform</h2>
                </div>
              </div>

              <h1 className="text-3xl font-semibold leading-tight tracking-tight">
                Manage your educational center with confidence.
              </h1>
              <p className="mt-6 text-base text-white/80">
                Sign in to access your personalized dashboard, monitor student performance, and streamline administrative tasks.
              </p>

              <ul className="mt-10 space-y-4">
                {featureHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
                      <Check className="h-4 w-4" />
                    </span>
                    <p className="text-sm leading-relaxed text-white/80">{item}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 mt-12">
              <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur">
                <p className="text-sm text-white/80">
                  “Scolink centralizes our center operations. We save hours each week and our team stays aligned.”
                </p>
                <div className="mt-4 text-sm font-medium text-white">- Scolink Partner Center</div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl font-semibold text-text-primary">Sign in</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Enter your email/phone and password to access your account.
                </p>
              </div>

              <form className="grid gap-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {successMessage && (
                    <Alert className="border-success bg-success/10">
                      <AlertDescription className="text-success">{successMessage}</AlertDescription>
                    </Alert>
                  )}
                  {error && (
                    <Alert variant="destructive" className="border-error bg-error/10">
                      <AlertDescription className="text-error">{error}</AlertDescription>
                    </Alert>
                  )}
                  <AppInput
                    placeholder="Email or Phone Number"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <AppInput
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-text-secondary">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-interactive focus:ring-interactive"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="font-medium text-interactive transition-colors hover:text-interactive/80"
                  >
                    Forgot password?
                  </button>
                </div>

                <ModernButton
                  type="submit"
                  disabled={isLoading}
                  fullWidth
                  className="h-12 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-70"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign in to dashboard'
                  )}
                </ModernButton>

                <div>
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-[0.3em] text-text-muted">
                      <span className="bg-surface px-3">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-3 rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm font-medium text-text-primary transition-all hover:bg-surface hover:shadow-md"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-3 rounded-lg border border-border bg-surface-secondary px-4 py-3 text-sm font-medium text-text-primary transition-all hover:bg-surface hover:shadow-md"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-8 text-center text-sm text-text-secondary">
                New to Scolink?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-interactive hover:text-interactive/80"
                >
                  Create your center account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
