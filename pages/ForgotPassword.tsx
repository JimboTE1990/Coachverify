import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, ArrowLeft, CheckCircle, Loader } from 'lucide-react';
import { CoachDogFullLogo } from '../components/Layout';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <CoachDogFullLogo className="h-16 w-auto" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12">

            {!emailSent ? (
              <>
                {/* Icon */}
                <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-10 w-10 text-brand-600" />
                </div>

                {/* Header */}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 text-center">
                  Forgot Password?
                </h1>
                <p className="text-slate-600 text-center mb-8">
                  No worries! Enter your email and we'll send you a reset link.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>

                {/* Back to Login */}
                <div className="mt-8 text-center">
                  <Link
                    to="/for-coaches"
                    className="inline-flex items-center text-slate-600 hover:text-brand-600 font-medium transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center animate-fade-in">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>

                  <h1 className="text-2xl font-bold text-slate-900 mb-3">
                    Check Your Email
                  </h1>
                  <p className="text-slate-600 mb-2">
                    We've sent a password reset link to:
                  </p>
                  <p className="text-brand-600 font-bold mb-8">
                    {email}
                  </p>

                  <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-8">
                    <p className="text-brand-900 text-sm font-medium mb-2">
                      What's next?
                    </p>
                    <ol className="text-brand-800 text-sm text-left space-y-1 ml-4 list-decimal">
                      <li>Check your email inbox (and spam folder)</li>
                      <li>Click the reset link within 10 minutes</li>
                      <li>Create your new password</li>
                    </ol>
                  </div>

                  <button
                    onClick={() => {
                      setEmailSent(false);
                      setEmail('');
                      setError('');
                    }}
                    className="text-slate-600 hover:text-brand-600 font-medium text-sm transition-colors"
                  >
                    Send to a different email
                  </button>

                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <Link
                      to="/for-coaches"
                      className="inline-flex items-center text-slate-600 hover:text-brand-600 font-medium transition-colors text-sm"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Link>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-8">
          Need help? Contact support@coachdog.com
        </p>
      </div>
    </div>
  );
};
