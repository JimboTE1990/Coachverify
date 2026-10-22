// DEV POC — community magic-link sign-in modal
import React, { useState } from 'react';
import { X, Mail, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  onClose: () => void;
}

type Step = 'form' | 'sending' | 'sent' | 'error';

export const CommunityAuthModal: React.FC<Props> = ({ onClose }) => {
  const [step, setStep] = useState<Step>('form');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim()) return;

    setStep('sending');

    // Store name + opt-in in localStorage — read back after magic link redirect
    localStorage.setItem('cd_community_name', displayName.trim());
    localStorage.setItem('cd_community_optin', String(marketingOptIn));

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // Redirect back to the exact page they were on
        emailRedirectTo: window.location.href,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setStep('error');
    } else {
      setStep('sent');
    }
  };

  const handleResend = async () => {
    setStep('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href, shouldCreateUser: true },
    });
    if (error) {
      setErrorMsg(error.message);
      setStep('error');
    } else {
      setStep('sent');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,25,36,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2D8A7E' }}>
              🐾 CoachDog Community
            </p>
            <h2 className="font-display font-bold text-slate-900 text-lg mt-0.5">
              {step === 'sent' ? 'Check your inbox' : 'Sign in to post'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6">

          {/* FORM */}
          {(step === 'form' || step === 'sending') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-slate-500">
                No password needed — we'll send you a one-click link.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. Jamie"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': '#2D8A7E' } as React.CSSProperties}
                  disabled={step === 'sending'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all"
                  disabled={step === 'sending'}
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={e => setMarketingOptIn(e.target.checked)}
                  className="mt-0.5 rounded"
                  disabled={step === 'sending'}
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  Keep me updated with coaching insights and news from CoachDog{' '}
                  <span className="text-slate-400">(optional)</span>
                </span>
              </label>

              <button
                type="submit"
                disabled={step === 'sending' || !displayName.trim() || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: '#2D8A7E' }}
              >
                {step === 'sending' ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Sending your link…
                  </>
                ) : (
                  'Continue — send me a link →'
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                By continuing you agree to our{' '}
                <a href="/terms" className="underline">Terms of Service</a>.
              </p>
            </form>
          )}

          {/* SENT */}
          {step === 'sent' && (
            <div className="text-center space-y-4">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: '#E8F5F3' }}
              >
                <Mail className="h-7 w-7" style={{ color: '#2D8A7E' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Link sent to {email}</p>
                <p className="text-sm text-slate-500">
                  Click the link in your inbox to return here and post your reply. It expires in 10 minutes.
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Didn't get it?{' '}
                <button
                  onClick={handleResend}
                  className="font-semibold underline"
                  style={{ color: '#2D8A7E' }}
                >
                  Resend link
                </button>
              </p>
            </div>
          )}

          {/* ERROR */}
          {step === 'error' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{errorMsg}</p>
              <button
                onClick={() => setStep('form')}
                className="text-sm font-semibold"
                style={{ color: '#2D8A7E' }}
              >
                Try again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
