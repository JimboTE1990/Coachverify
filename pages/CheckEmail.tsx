import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { CoachDogFullLogo } from '../components/Layout';

export const CheckEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from location state (passed from signup page)
  const emailFromState = (location.state as any)?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);

  // Countdown timer for rate limiting
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // If no email provided, redirect to signup
  useEffect(() => {
    if (!emailFromState) {
      console.warn('[CheckEmail] No email in location state');
    }
  }, [emailFromState]);

  const handleResend = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    // Rate limiting: prevent resends within 60 seconds
    const now = Date.now();
    if (lastResendTime && (now - lastResendTime) < 60000) {
      const waitTime = Math.ceil((60000 - (now - lastResendTime)) / 1000);
      setCountdown(waitTime);
      setMessage(`Please wait ${waitTime} seconds before resending`);
      return;
    }

    setResending(true);
    setMessage('');

    try {
      console.log('[CheckEmail] Resending verification email to:', email);

      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      console.log('[CheckEmail] Resend result:', { data, error });

      if (error) {
        console.error('[CheckEmail] Resend error:', error);

        // Handle specific error cases
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          setMessage('Too many requests. Please wait a few minutes before trying again.');
          setCountdown(120); // 2 minute cooldown
        } else if (error.message.includes('not found') || error.message.includes('User not found')) {
          setMessage('Email address not found. Please check your email or sign up again.');
        } else if (error.message.includes('already confirmed') || error.message.includes('already verified')) {
          setMessage('This email is already verified! You can log in now.');
          setTimeout(() => navigate('/coach-login'), 2000);
        } else {
          setMessage(error.message || 'Failed to send verification email. Please try again.');
        }
        return;
      }

      // Success
      setLastResendTime(now);
      setResendCount(prev => prev + 1);
      setMessage('✅ Verification email sent successfully! Please check your inbox and spam folder.');
      setCountdown(60); // 1 minute cooldown before allowing another resend

    } catch (err: any) {
      console.error('[CheckEmail] Resend failed with exception:', err);
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

            {/* Icon */}
            <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Mail className="h-10 w-10 text-brand-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 mb-3 text-center">
              Check Your Email
            </h1>

            {emailFromState && (
              <p className="text-slate-600 mb-2 text-center">
                We sent a verification link to:
              </p>
            )}

            {emailFromState && (
              <p className="text-brand-600 font-bold mb-6 text-center break-all">
                {emailFromState}
              </p>
            )}

            <p className="text-slate-600 mb-8 text-center text-sm">
              Click the verification link in the email to activate your 30-day free trial and access your dashboard.
            </p>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                What to do next:
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Check your inbox for an email from CoachVerify</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Check your spam/junk folder if you don't see it</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Click the verification link to complete signup</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Email link expires after 24 hours</span>
                </li>
              </ul>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`rounded-xl p-4 mb-6 ${
                message.includes('✅')
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm ${
                  message.includes('✅') ? 'text-green-800' : 'text-red-700'
                }`}>
                  {message}
                </p>
              </div>
            )}

            {/* Resend Section */}
            {!showResendForm && (
              <div className="text-center mb-6">
                <p className="text-sm text-slate-600 mb-3">
                  Didn't receive the email?
                </p>
                <button
                  onClick={() => setShowResendForm(true)}
                  className="text-brand-600 font-bold hover:underline text-sm"
                >
                  Resend verification email
                </button>
              </div>
            )}

            {/* Resend Form */}
            {showResendForm && (
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-slate-900 mb-3 text-sm">
                  Resend Verification Email
                </h3>
                {!emailFromState && (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none mb-3"
                  />
                )}
                <button
                  onClick={handleResend}
                  disabled={resending || !email || countdown > 0}
                  className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    <>Wait {countdown}s</>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      Resend Email {resendCount > 0 && `(${resendCount})`}
                    </>
                  )}
                </button>
                {resendCount > 0 && (
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Email sent {resendCount} {resendCount === 1 ? 'time' : 'times'}
                  </p>
                )}
              </div>
            )}

            {/* Back to Login */}
            <div className="text-center pt-4 border-t border-slate-100">
              <button
                onClick={() => navigate('/coach-login')}
                className="text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center justify-center mx-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </button>
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
