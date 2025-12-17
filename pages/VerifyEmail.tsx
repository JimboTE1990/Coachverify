import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Loader, Mail, RefreshCw } from 'lucide-react';
import { CoachDogFullLogo } from '../components/Layout';

export const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  // Prevent duplicate processing in React StrictMode
  const processingRef = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // GUARD: Prevent duplicate calls from React StrictMode double-mount
      if (processingRef.current) {
        console.log('[VerifyEmail] Already processing, skipping duplicate call');
        return;
      }
      processingRef.current = true;

      try {
        console.log('[VerifyEmail] ====== STARTING VERIFICATION ======');
        console.log('[VerifyEmail] URL:', window.location.href);

        // Parse hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');

        console.log('[VerifyEmail] Parsed tokens:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
          error,
          errorCode
        });

        // Handle errors in URL
        if (error || errorCode === 'otp_expired') {
          console.error('[VerifyEmail] Link error detected');
          setStatus('expired');
          setMessage('This verification link has expired. Email verification links expire after 24 hours. Please request a new one below.');
          return;
        }

        // Validate tokens exist
        if (!accessToken || !type) {
          console.error('[VerifyEmail] Missing required tokens');
          setStatus('error');
          setMessage('Invalid verification link. Please use the complete link from your email, or request a new one below.');
          return;
        }

        console.log('[VerifyEmail] ✅ Verification link is valid');
        console.log('[VerifyEmail] Supabase has already confirmed the email');
        console.log('[VerifyEmail] Database trigger should have created the profile automatically');

        // NO NEED to call setSession() - Supabase already verified the email when link was clicked
        // The database trigger (006_auto_create_profile_trigger.sql) creates the profile automatically
        // We just show success and redirect to login

        setStatus('success');
        setMessage('Your email has been verified! Your 30-day free trial is now active. Please log in to access your dashboard.');

        // Redirect to login after 2 seconds (faster than before)
        setTimeout(() => {
          console.log('[VerifyEmail] Redirecting to login...');
          navigate('/coach-login');
        }, 2000);

      } catch (err: any) {
        console.error('[VerifyEmail] Error:', err);
        setStatus('error');
        setMessage(err.message || 'An unexpected error occurred during verification.');
      }
    };

    verifyEmail();
  }, [navigate]);

  const handleResendVerification = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setResending(true);
    setMessage(''); // Clear any existing messages

    try {
      console.log('[VerifyEmail] Resending verification email to:', email);

      // Use resend for email verification
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      console.log('[VerifyEmail] Resend result:', { data, error });

      if (error) {
        console.error('[VerifyEmail] Resend error:', error);

        // Handle specific error cases
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          setMessage('Please wait a few minutes before requesting another verification email.');
        } else if (error.message.includes('not found') || error.message.includes('invalid')) {
          setMessage('Email address not found. Please check your email or sign up again.');
        } else {
          setMessage(error.message || 'Failed to send verification email. Please try again.');
        }
        return;
      }

      // Success - show user-friendly message (keep status as 'expired' to show resend form)
      setMessage('✅ Verification email sent successfully! Please check your inbox (and spam folder).');
      setEmail(''); // Clear email input on success

    } catch (err: any) {
      console.error('[VerifyEmail] Resend failed with exception:', err);
      setMessage('An unexpected error occurred. Please try again or contact support.');
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

            {/* Loading State */}
            {status === 'loading' && (
              <div className="text-center">
                <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader className="h-10 w-10 text-brand-600 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">Verifying your email...</h1>
                <p className="text-slate-600">Please wait while we confirm your email address.</p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="text-center animate-fade-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">Verification Successful!</h1>
                <p className="text-slate-600 mb-6">{message}</p>
                <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                  <p className="text-brand-800 text-sm font-medium">
                    Redirecting you to the login page...
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="text-center animate-fade-in">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">Verification Failed</h1>
                <p className="text-slate-600 mb-6">{message}</p>
                <button
                  onClick={() => navigate('/coach-signup')}
                  className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors"
                >
                  Back to Sign Up
                </button>
              </div>
            )}

            {/* Expired State with Resend Option */}
            {status === 'expired' && (
              <div className="text-center animate-fade-in">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-10 w-10 text-yellow-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">Link Expired</h1>
                <p className="text-slate-600 mb-6">{message}</p>

                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-4 text-left">
                    Enter your email to receive a new verification link:
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none mb-3"
                  />
                  <button
                    onClick={handleResendVerification}
                    disabled={resending || !email}
                    className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {resending ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => navigate('/coach-login')}
                  className="text-slate-600 hover:text-slate-900 font-medium text-sm"
                >
                  Back to Login
                </button>
              </div>
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
