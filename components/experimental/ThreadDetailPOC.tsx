// DEV POC — thread detail: coach-only replies, upvoting, sorting, inline editing
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronUp, MessageCircle, ArrowLeft, ShieldCheck,
  ThumbsUp, Pencil, Check, X, LogOut,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { THREADS } from './mockData';
import { PocNav } from './PocNav';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface LiveReply {
  id: string;
  body: string;
  display_name: string;
  upvotes: number;
  coach_id: string | null;
  coach_photo_url: string | null;
  coach_accreditation: string | null;
  created_at: string;
  edited_at: string | null;
}

interface CommunityProfile {
  display_name: string;
}

interface LiveThread {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  author_name: string;
  user_id: string | null;
  tag: string;
  upvotes: number;
  edited_at: string | null;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildAccreditationLabel(coach: NonNullable<ReturnType<typeof useAuth>['coach']>): string {
  const parts: string[] = [];
  if (coach.verificationBody) parts.push(coach.verificationBody);
  if (coach.acVerified) parts.push('AC');
  return parts.join(' · ') || 'Verified Coach';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ThreadDetailPOC: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { coach } = useAuth();

  // Community user auth (magic-link, for editing their own question)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [communityProfile, setCommunityProfile] = useState<CommunityProfile | null>(null);

  // Thread
  const [liveThread, setLiveThread] = useState<LiveThread | null>(null);
  const [threadLoading, setThreadLoading] = useState(true);
  const [editingThread, setEditingThread] = useState(false);
  const [threadEditBody, setThreadEditBody] = useState('');
  const [threadSaving, setThreadSaving] = useState(false);

  // Replies
  const [liveReplies, setLiveReplies] = useState<LiveReply[]>([]);
  const [sortMode, setSortMode] = useState<'newest' | 'most_helpful'>('newest');
  const [votedReplies, setVotedReplies] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('cd_voted_replies') ?? '[]')); }
    catch { return new Set(); }
  });
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [replyEditBody, setReplyEditBody] = useState('');
  const [replySaving, setReplySaving] = useState(false);

  // Reply form
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const mockThread = THREADS.find(t => t.slug === slug);

  // ── Derived thread object ─────────────────────────────────────────────────

  const thread = mockThread ?? (liveThread
    ? {
        slug: liveThread.slug,
        title: liveThread.title,
        body: liveThread.body ?? '',
        author: liveThread.author_name,
        createdAt: timeAgo(liveThread.created_at),
        upvotes: liveThread.upvotes,
        replies: [] as typeof THREADS[0]['replies'],
      }
    : null);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchReplies = async (threadSlug: string) => {
    const { data } = await supabase
      .from('community_replies')
      .select('id, body, display_name, upvotes, coach_id, coach_photo_url, coach_accreditation, created_at, edited_at')
      .eq('thread_slug', threadSlug)
      .order('created_at', { ascending: true });
    if (data) setLiveReplies(data as LiveReply[]);
  };

  const fetchCommunityProfile = async (userId: string) => {
    const { data } = await supabase
      .from('community_users')
      .select('display_name')
      .eq('user_id', userId)
      .single();
    if (data) setCommunityProfile(data);
  };

  const completeCommunitySignup = async (userId: string) => {
    const storedName = localStorage.getItem('cd_community_name');
    const storedOptIn = localStorage.getItem('cd_community_optin') === 'true';
    if (storedName) {
      await supabase.from('community_users').upsert(
        { user_id: userId, display_name: storedName, marketing_opt_in: storedOptIn },
        { onConflict: 'user_id' }
      );
      localStorage.removeItem('cd_community_name');
      localStorage.removeItem('cd_community_optin');
    }
    await fetchCommunityProfile(userId);
  };

  useEffect(() => {
    if (!slug) return;

    const init = async () => {
      if (!mockThread) {
        const { data } = await supabase
          .from('community_threads')
          .select('id, slug, title, body, author_name, user_id, tag, upvotes, edited_at, created_at')
          .eq('slug', slug)
          .single();
        if (data) setLiveThread(data as LiveThread);
      }
      setThreadLoading(false);
      fetchReplies(slug);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        fetchCommunityProfile(session.user.id);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user);
        await completeCommunitySignup(session.user.id);
        const pending = localStorage.getItem('cd_pending_reply');
        if (pending) {
          setReplyText(pending);
          localStorage.removeItem('cd_pending_reply');
        }
      }
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCommunityProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [slug]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleVote = async (replyId: string) => {
    if (votedReplies.has(replyId)) return;
    // Optimistic update
    setLiveReplies(prev => prev.map(r => r.id === replyId ? { ...r, upvotes: r.upvotes + 1 } : r));
    const next = new Set(votedReplies).add(replyId);
    setVotedReplies(next);
    try { localStorage.setItem('cd_voted_replies', JSON.stringify([...next])); } catch {}
    await supabase.rpc('increment_reply_upvote', { reply_id: replyId });
  };

  const handleSaveReplyEdit = async (replyId: string) => {
    if (!replyEditBody.trim()) return;
    setReplySaving(true);
    const { error } = await supabase
      .from('community_replies')
      .update({ body: replyEditBody.trim(), edited_at: new Date().toISOString() })
      .eq('id', replyId);
    if (!error) {
      setLiveReplies(prev => prev.map(r =>
        r.id === replyId ? { ...r, body: replyEditBody.trim(), edited_at: new Date().toISOString() } : r
      ));
      setEditingReplyId(null);
    }
    setReplySaving(false);
  };

  const handleSaveThreadEdit = async () => {
    if (!threadEditBody.trim() || !liveThread) return;
    setThreadSaving(true);
    const { error } = await supabase
      .from('community_threads')
      .update({ body: threadEditBody.trim(), edited_at: new Date().toISOString() })
      .eq('id', liveThread.id);
    if (!error) {
      setLiveThread(prev => prev
        ? { ...prev, body: threadEditBody.trim(), edited_at: new Date().toISOString() }
        : null
      );
      setEditingThread(false);
    }
    setThreadSaving(false);
  };

  const handlePostReply = async () => {
    if (!replyText.trim() || !coach || !currentUser) return;
    setSubmitting(true);
    setSubmitError('');
    const { error } = await supabase.from('community_replies').insert({
      thread_slug: slug!,
      user_id: currentUser.id,
      display_name: coach.name,
      body: replyText.trim(),
      coach_id: coach.id,
      coach_photo_url: coach.photoUrl ?? null,
      coach_accreditation: buildAccreditationLabel(coach),
    });
    if (error) {
      setSubmitError('Something went wrong. Please try again.');
    } else {
      setReplyText('');
      fetchReplies(slug!);
    }
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // ── Sorted display list ───────────────────────────────────────────────────

  const displayReplies = useMemo(() => {
    if (sortMode === 'most_helpful') {
      return [...liveReplies].sort((a, b) => {
        if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    }
    return liveReplies;
  }, [liveReplies, sortMode]);

  const topReplyId = useMemo(() => {
    if (liveReplies.length === 0) return null;
    const top = [...liveReplies].sort((a, b) => b.upvotes - a.upvotes)[0];
    return top.upvotes > 0 ? top.id : null;
  }, [liveReplies]);

  // ── Loading / not-found guards ────────────────────────────────────────────

  if (threadLoading && !mockThread) {
    return (
      <>
        <PocNav />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </>
    );
  }

  if (!thread) {
    return (
      <>
        <PocNav />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 mb-4">Thread not found.</p>
            <Link to="/insights-poc" className="text-sm font-semibold" style={{ color: '#2D8A7E' }}>
              ← Back to Community
            </Link>
          </div>
        </div>
      </>
    );
  }

  const mockCoachReplies = mockThread?.replies.filter(r => r.isCoach) ?? [];
  const mockPublicReplies = mockThread?.replies.filter(r => !r.isCoach) ?? [];
  const isThreadOwner = !mockThread && !!liveThread && !!currentUser && currentUser.id === liveThread.user_id;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <PocNav />
      <div className="min-h-screen bg-slate-50">

        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link
              to="/insights-poc"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Community
            </Link>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {coach && (
                <span className="font-medium text-slate-700">
                  Replying as <span style={{ color: '#2D8A7E' }}>{coach.name}</span>
                </span>
              )}
              {!coach && currentUser && communityProfile && (
                <span className="font-medium text-slate-700">{communityProfile.display_name}</span>
              )}
              {currentUser && (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 hover:text-slate-800 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* ── Original question ── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 leading-snug mb-4">
              {thread.title}
            </h1>

            {/* Body: editable for thread owner */}
            {editingThread ? (
              <div className="mb-4 space-y-2">
                <textarea
                  autoFocus
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all resize-none"
                  rows={5}
                  value={threadEditBody}
                  onChange={e => setThreadEditBody(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveThreadEdit}
                    disabled={threadSaving || !threadEditBody.trim()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-full disabled:opacity-50"
                    style={{ backgroundColor: '#2D8A7E' }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {threadSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingThread(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="group relative mb-6">
                <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                  {thread.body}
                </p>
                {isThreadOwner && (
                  <button
                    onClick={() => { setThreadEditBody(liveThread?.body ?? ''); setEditingThread(true); }}
                    className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600"
                    title="Edit your question"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3">
                <span className="bg-slate-100 rounded-full px-3 py-1 font-medium">{thread.author}</span>
                <span>{thread.createdAt}</span>
                {liveThread?.edited_at && (
                  <span className="text-slate-400 italic">edited</span>
                )}
              </div>
              <button className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                <ChevronUp className="h-4 w-4" />
                {thread.upvotes}
              </button>
            </div>
          </div>

          {/* ── Mock coach replies (for mock/seed threads) ── */}
          {mockCoachReplies.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                Coach Answers
              </p>
              {mockCoachReplies.map(reply => (
                <div
                  key={reply.id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                  style={{ borderLeft: '4px solid #2D8A7E' }}
                >
                  <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                      ⭐ Featured Coach Reply
                    </span>
                  </div>
                  <div className="p-6 sm:p-8">
                    <p className="text-slate-700 leading-relaxed text-sm sm:text-base mb-6">{reply.body}</p>
                    {reply.coach && (
                      <div className="flex items-center justify-between flex-wrap gap-3 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#2D8A7E' }}>
                            {reply.coach.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{reply.coach.name}</p>
                            <p className="text-xs text-slate-500">{reply.coach.title}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <ShieldCheck className="h-3 w-3 text-trust-500" />
                              <span className="text-xs text-trust-600 font-medium">{reply.coach.accreditation}</span>
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/coach/${reply.coach.coachId}`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:opacity-90"
                          style={{ color: '#2D8A7E', borderColor: '#2D8A7E' }}
                        >
                          View Profile →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Mock community replies ── */}
          {mockPublicReplies.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5" />
                Community Replies ({mockPublicReplies.length + liveReplies.length})
              </p>
              {mockPublicReplies.map(reply => (
                <div key={reply.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
                  <p className="text-slate-700 text-sm leading-relaxed mb-4">{reply.body}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 rounded-full px-2.5 py-0.5 font-medium">{reply.author}</span>
                      <span>{reply.createdAt}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <ChevronUp className="h-3.5 w-3.5" />
                      {reply.upvotes}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Live DB replies ── */}
          {displayReplies.length > 0 && (
            <div className="space-y-3">
              {/* Header + sort toggle */}
              <div className="flex items-center justify-between px-1">
                {mockPublicReplies.length === 0 && (
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {displayReplies.length} {displayReplies.length === 1 ? 'Reply' : 'Replies'}
                  </p>
                )}
                <div className="flex items-center gap-1 ml-auto">
                  {(['newest', 'most_helpful'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSortMode(mode)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        sortMode === mode
                          ? 'text-white border-transparent'
                          : 'border-slate-200 text-slate-500 hover:border-slate-400'
                      }`}
                      style={sortMode === mode ? { backgroundColor: '#2D8A7E' } : {}}
                    >
                      {mode === 'newest' ? 'Newest' : 'Most Helpful'}
                    </button>
                  ))}
                </div>
              </div>

              {displayReplies.map(reply => {
                const isCoachReply = !!reply.coach_id || !!reply.coach_accreditation;
                const isOwnReply = coach && reply.coach_id === coach.id;
                const isTopReply = reply.id === topReplyId;
                const hasVoted = votedReplies.has(reply.id);

                if (isCoachReply) {
                  return (
                    <div
                      key={reply.id}
                      className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                      style={{ borderLeft: '4px solid #2D8A7E' }}
                    >
                      {isTopReply && sortMode === 'most_helpful' && (
                        <div className="px-6 py-3 border-b border-slate-50 flex items-center gap-2">
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                            ⭐ Most Helpful
                          </span>
                        </div>
                      )}
                      <div className="p-5 sm:p-6">
                        {/* Coach reply body */}
                        {editingReplyId === reply.id ? (
                          <div className="mb-4 space-y-2">
                            <textarea
                              autoFocus
                              className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                              rows={4}
                              value={replyEditBody}
                              onChange={e => setReplyEditBody(e.target.value)}
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSaveReplyEdit(reply.id)}
                                disabled={replySaving || !replyEditBody.trim()}
                                className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-full disabled:opacity-50"
                                style={{ backgroundColor: '#2D8A7E' }}
                              >
                                <Check className="h-3.5 w-3.5" />
                                {replySaving ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingReplyId(null)}
                                className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="group relative mb-5">
                            <p className="text-slate-700 leading-relaxed text-sm">{reply.body}</p>
                            {isOwnReply && (
                              <button
                                onClick={() => { setReplyEditBody(reply.body); setEditingReplyId(reply.id); }}
                                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600"
                                title="Edit reply"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Coach byline */}
                        <div className="flex items-center justify-between flex-wrap gap-3 border-t border-slate-100 pt-4">
                          <div className="flex items-center gap-3">
                            {reply.coach_photo_url ? (
                              <img
                                src={reply.coach_photo_url}
                                alt={reply.display_name}
                                className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div
                                className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                style={{ backgroundColor: '#2D8A7E' }}
                              >
                                {reply.display_name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-slate-900">{reply.display_name}</p>
                              {reply.coach_accreditation && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <ShieldCheck className="h-3 w-3 text-trust-500" />
                                  <span className="text-xs text-trust-600 font-medium">{reply.coach_accreditation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <span>{timeAgo(reply.created_at)}</span>
                              {reply.edited_at && <span className="italic">· edited</span>}
                            </div>
                            <button
                              onClick={() => handleVote(reply.id)}
                              disabled={hasVoted}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-all ${
                                hasVoted
                                  ? 'border-transparent text-white'
                                  : 'border-slate-200 text-slate-500 hover:border-slate-400'
                              }`}
                              style={hasVoted ? { backgroundColor: '#2D8A7E' } : {}}
                              title="Mark as helpful"
                            >
                              <ThumbsUp className="h-3 w-3" />
                              {reply.upvotes > 0 && reply.upvotes}
                            </button>
                            <Link
                              to={reply.coach_id ? `/coach/${reply.coach_id}` : '/search'}
                              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:opacity-90"
                              style={{ color: '#2D8A7E', borderColor: '#2D8A7E' }}
                            >
                              {reply.coach_id ? 'View Profile →' : 'Find a Coach →'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Non-coach live reply (legacy)
                return (
                  <div key={reply.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
                    <p className="text-slate-700 text-sm leading-relaxed mb-4">{reply.body}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2.5 py-0.5 font-medium text-white"
                          style={{ backgroundColor: '#2D8A7E' }}
                        >
                          {reply.display_name}
                        </span>
                        <span>{timeAgo(reply.created_at)}</span>
                      </div>
                      <button
                        onClick={() => handleVote(reply.id)}
                        disabled={hasVoted}
                        className={`flex items-center gap-1 ${hasVoted ? 'opacity-50 cursor-default' : 'hover:text-slate-700'}`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {reply.upvotes > 0 && reply.upvotes}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Reply form ── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h3 className="font-display font-bold text-slate-900 mb-4">Post a Reply</h3>

            {coach ? (
              <>
                <textarea
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
                  rows={4}
                  placeholder="Share your expertise or perspective…"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
                {submitError && (
                  <p className="text-xs text-red-500 mt-2">{submitError}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-slate-400">
                    Replying as <span className="font-semibold text-slate-600">{coach.name}</span>
                    {' · '}
                    <span style={{ color: '#2D8A7E' }}>{buildAccreditationLabel(coach)}</span>
                  </p>
                  <button
                    onClick={handlePostReply}
                    disabled={submitting || !replyText.trim() || !currentUser}
                    className="text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#2D8A7E' }}
                  >
                    {submitting ? 'Posting…' : 'Post Reply'}
                  </button>
                </div>
                {!currentUser && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-4 py-2 rounded-xl">
                    Your coach session is loading — if this persists, try refreshing the page.
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: '#E8F5F3' }}
                >
                  <ShieldCheck className="h-6 w-6" style={{ color: '#2D8A7E' }} />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  Only verified CoachDog coaches can reply
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Replies come from accredited, vetted coaches — so you know the advice is legit.
                </p>
                <Link
                  to="/coach-login"
                  className="inline-block text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#2D8A7E' }}
                >
                  Log in as a Coach →
                </Link>
                <p className="text-xs text-slate-400 mt-3">
                  Not on CoachDog yet?{' '}
                  <Link to="/coach-signup" className="underline" style={{ color: '#2D8A7E' }}>
                    Apply to join
                  </Link>
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};
