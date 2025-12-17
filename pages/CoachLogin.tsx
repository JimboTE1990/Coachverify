import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { CoachDogFullLogo } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

export const CoachLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading: authLoading, isAuthenticated } = useAuth();

  // Redirect if already logged in (wait for auth to finish loading)
  useEffect(() => {
    console.log('[CoachLogin] Auth state:', { authLoading, isAuthenticated });

    if (!authLoading && isAuthenticated) {
      console.log('[CoachLogin] User already logged in, redirecting to dashboard');
      navigate('/for-coaches', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[CoachLogin] Attempting login for:', email);
      const result = await login(email, password);

      console.log('[CoachLogin] Login result:', { success: result.success, error: result.error });

      if (result.success) {
        console.log('[CoachLogin] Login successful, navigating to dashboard');
        // Check if there's a redirect URL from location state
        const from = (location.state as any)?.from?.pathname || '/for-coaches';
        navigate(from, { replace: true });
      } else {
        console.error('[CoachLogin] Login failed:', result.error);
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('[CoachLogin] Login exception:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-500 to-indigo-600"></div>

        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex justify-center">
            <CoachDogFullLogo className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Coach Portal</h1>
          <p className="text-slate-500 mt-2">Manage your practice in one place.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-bold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none pr-10 transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl flex items-center border border-red-100">
              <Lock className="h-4 w-4 mr-2" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || authLoading || !email || !password}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? 'Accessing Portal...' : 'Enter Dashboard'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          <p className="text-sm text-slate-500">
            New to CoachDog? <Link to="/coach-signup" className="text-brand-600 font-bold hover:underline">Join the network</Link>
          </p>
          <p className="text-sm text-slate-500">
            Haven't verified your email? <Link to="/resend-verification" className="text-brand-600 font-bold hover:underline">Resend verification email</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
