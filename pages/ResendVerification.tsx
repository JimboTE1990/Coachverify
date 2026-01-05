import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import { CoachDogFullLogo } from '../components/Layout';
import { handleVerificationError } from '../utils/errorHandling';

export const ResendVerification: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setResending(true);
    setMessage('');
    setSuccess(false);

    try {
      console.log('[ResendVerification] Resending verification email to:', email);
      console.log('[ResendVerification] Using redirect URL:', `${window.location.origin}/verify-email`);

      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      console.log('[ResendVerification] Resend result:', {
        data,
        error,
        hasData: !!data,
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : null,
        fullData: data,
        fullError: error
      });

      if (error) {
        const errorResponse = handleVerificationError(error, {
          component: 'ResendVerification',
          action: 'resend verification email',
          metadata: { email }
        });

        setMessage(errorResponse.userMessage);

        // Handle redirect if needed (e.g., already verified -> login)
        if (errorResponse.shouldRedirect) {
          setTimeout(() => navigate(errorResponse.shouldRedirect!), 2000);
        }

        return;
      }

      // Check if data is null (Supabase sometimes returns success with null data)
      if (!data) {
        console.warn('[ResendVerification] Resend returned null data - email may not have been sent');
        setMessage('Email may already be verified, or the account does not exist. Please try logging in or signing up again.');
        return;
      }

      setSuccess(true);
      setMessage('✅ Verification email sent successfully! Please check your inbox (and spam folder). The email may take a few minutes to arrive.');
      setEmail('');

    } catch (err: any) {
      const errorResponse = handleVerificationError(err, {
        component: 'ResendVerification',
        action: 'resend verification email (exception)',
        metadata: { email }
      });

      setMessage(errorResponse.userMessage);

      if (errorResponse.shouldRedirect) {
        setTimeout(() => navigate(errorResponse.shouldRedirect!), 2000);
      }
    } finally {
      setResending(false);
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

            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Icon */}
            <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="h-10 w-10 text-brand-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 mb-3 text-center">
              Resend Verification Email
            </h1>
            <p className="text-slate-600 mb-8 text-center">
              Enter your email address to receive a new verification link.
            </p>

            {/* Form */}
            <form onSubmit={handleResend} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Message */}
              {message && (
                <div className={`rounded-xl p-4 ${
                  success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start">
                    {success && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />}
                    <p className={`text-sm ${success ? 'text-green-800' : 'text-red-700'}`}>
                      {message}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={resending || !email}
                className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500 text-center">
                Verification links expire after 24 hours. If your link has expired, use this form to get a new one.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-8">
          Need help? Contact <a href="mailto:support@coachdog.com" className="text-brand-400 hover:text-brand-300 underline">support@coachdog.com</a>
        </p>
      </div>
    </div>
  );
};
