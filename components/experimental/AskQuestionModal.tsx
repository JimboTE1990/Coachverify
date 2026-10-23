// DEV POC — modal for posting a new community question with magic-link identity
import React, { useState, useEffect } from 'react';
import { X, EyeOff, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { COMMUNITY_TAGS, COMMUNITY_TAG_COLORS, type CommunityTag } from '../../constants/communityTags';

interface Props {
  onClose: () => void;
  onPosted: (slug: string) => void;
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) +
    '-' +
    Date.now().toString(36)
  );
}

type ModalState = 'loading' | 'email_gate' | 'form' | 'sending' | 'check_email' | 'submitting';

export const AskQuestionModal: React.FC<Props> = ({ onClose, onPosted }) => {
  const [state, setState] = useState<ModalState>('loading');
  const [existingName, setExistingName] = useState('');

  // Shared identity fields (used in email_gate and pre-filled in form)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  // Question form fields (only used in authenticated 'form' state)
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState<CommunityTag>('Career');

  const [error, setError] = useState('');

  // On open: check for an existing session
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Already authenticated — check for a community profile
        const { data } = await supabase
          .from('community_users')
          .select('display_name')
          .eq('user_id', session.user.id)
          .single();
        if (data?.display_name) {
          setExistingName(data.display_name);
          setName(data.display_name);
        }
        setEmail(session.user.email ?? '');
        setState('form');
      } else {
        // Not authenticated — show the email verification gate first
        setState('email_gate');
      }
    });
  }, []);

  const postQuestion = async (userId: string, authorName: string): Promise<string | null> => {
    const slug = slugify(title);
    const { error: insertError } = await supabase.from('community_threads').insert({
      slug,
      title: title.trim(),
      body: body.trim() || null,
      author_name: anonymous ? 'Anonymous' : authorName,
      author_email: email.trim() || null,
      user_id: userId,
      tag,
    });
    if (insertError) {
      console.error('[postQuestion] insert failed:', insertError);
      return null;
    }
    return slug;
  };

  const getOrigin = () =>
    window.location.hostname === 'localhost'
      ? window.location.origin
      : 'https://www.coachdog.co.uk';

  // --- Email gate submit: send magic link, no question data in URL ---
  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!anonymous && !name.trim()) { setError('Please enter your name, or choose to post anonymously.'); return; }
    setError('');
    setState('sending');

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${getOrigin()}/community?ask=1`,
        shouldCreateUser: true,
        data: { role: 'community' },
      },
    });

    if (otpError) {
      setError('Could not send verification email. Please try again.');
      setState('email_gate');
      return;
    }
    setState('check_email');
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setState('sending');
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${getOrigin()}/community?ask=1`,
        shouldCreateUser: true,
        data: { role: 'community' },
      },
    });
    setState('check_email');
  };

  // --- Question form submit: user is authenticated, post directly ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (!anonymous && !name.trim())) return;
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError('Your session expired. Please close this and verify your email again.');
      return;
    }

    setState('submitting');

    // Upsert community profile
    await supabase.from('community_users').upsert(
      { user_id: session.user.id, display_name: anonymous ? 'Anonymous' : name.trim(), marketing_opt_in: false },
      { onConflict: 'user_id' }
    );

    const slug = await postQuestion(session.user.id, name.trim() || existingName);
    if (!slug) {
      setError('Something went wrong — please try again.');
      setState('form');
      return;
    }
    onPosted(slug);
  };

  const canSubmitGate = email.trim() && (anonymous || name.trim());
  const canSubmitForm = title.trim() && (anonymous || name.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-slate-900">Ask the Community</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading */}
        {state === 'loading' && (
          <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
        )}

        {/* Check email */}
        {state === 'check_email' && (
          <div className="text-center py-6">
            <div className="h-14 w-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-7 w-7" style={{ color: '#2D8A7E' }} />
            </div>
            <h3 className="font-display font-bold text-slate-900 text-lg mb-2">Check your inbox</h3>
            <p className="text-sm text-slate-500 mb-1">
              We've sent a link to <span className="font-semibold text-slate-700">{email}</span>
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Click it to verify your identity — you'll be brought back here to post your question.
            </p>
            <button
              onClick={handleResend}
              className="text-sm font-semibold underline"
              style={{ color: '#2D8A7E' }}
            >
              Resend email
            </button>
          </div>
        )}

        {/* Email gate — shown when not authenticated */}
        {(state === 'email_gate' || (state === 'sending' && existingName === '')) && (
          <form onSubmit={handleGateSubmit} className="space-y-4">
            <p className="text-sm text-slate-500">
              Verify your identity first — you'll be brought straight back to write your question.
            </p>

            {/* Name + anonymous toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Your name</label>
                <button
                  type="button"
                  onClick={() => setAnonymous(v => !v)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    anonymous
                      ? 'bg-slate-800 text-white border-transparent'
                      : 'border-slate-200 text-slate-500 hover:border-slate-400'
                  }`}
                >
                  <EyeOff className="h-3 w-3" />
                  Post anonymously
                </button>
              </div>
              <input
                type="text"
                required={!anonymous}
                disabled={anonymous}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                  anonymous
                    ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                    : 'border-slate-200'
                }`}
                placeholder={anonymous ? 'Your name will be hidden' : "How you'll appear in the community"}
                value={anonymous ? '' : name}
                onChange={e => setName(e.target.value)}
                maxLength={80}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                required
                autoFocus
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                placeholder="We'll send a quick verification link"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1.5">Never shown publicly. Used to verify you and notify you of coach replies.</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={state === 'sending' || !canSubmitGate}
              className="w-full py-3 rounded-full font-bold text-white text-sm transition-opacity disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#2D8A7E' }}
            >
              {state === 'sending' ? 'Sending…' : 'Send verification link'}
            </button>

            <p className="text-xs text-center text-slate-400">
              Your question will be visible to the community and verified coaches.
            </p>
          </form>
        )}

        {/* Question form — shown when authenticated */}
        {(state === 'form' || state === 'submitting') && (
          <form onSubmit={handleFormSubmit} className="space-y-4">

            {existingName && (
              <p className="text-xs font-semibold px-3 py-2 rounded-xl bg-teal-50" style={{ color: '#2D8A7E' }}>
                ✓ Signed in as {existingName}
              </p>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your question</label>
              <input
                type="text"
                required
                autoFocus
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                placeholder="e.g. How do I find a career coach who specialises in tech?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Topic</label>
              <div className="flex flex-wrap gap-2">
                {COMMUNITY_TAGS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      tag === t
                        ? `${COMMUNITY_TAG_COLORS[t]} border-transparent`
                        : 'border-slate-200 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                More detail <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
                rows={3}
                placeholder="Any context that would help coaches give you a better answer..."
                value={body}
                onChange={e => setBody(e.target.value)}
                maxLength={1000}
              />
            </div>

            {/* Name + anonymous toggle (only shown if no existing profile) */}
            {!existingName && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Your name</label>
                  <button
                    type="button"
                    onClick={() => setAnonymous(v => !v)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      anonymous
                        ? 'bg-slate-800 text-white border-transparent'
                        : 'border-slate-200 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <EyeOff className="h-3 w-3" />
                    Post anonymously
                  </button>
                </div>
                <input
                  type="text"
                  required={!anonymous}
                  disabled={anonymous}
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                    anonymous
                      ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                      : 'border-slate-200'
                  }`}
                  placeholder={anonymous ? 'Your name will be hidden' : "How you'll appear in the community"}
                  value={anonymous ? '' : name}
                  onChange={e => setName(e.target.value)}
                  maxLength={80}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={state === 'submitting' || !canSubmitForm}
              className="w-full py-3 rounded-full font-bold text-white text-sm transition-opacity disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#2D8A7E' }}
            >
              {state === 'submitting' ? 'Posting…' : 'Post Question'}
            </button>

            <p className="text-xs text-center text-slate-400">
              Your question will be visible to the community and verified coaches.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
