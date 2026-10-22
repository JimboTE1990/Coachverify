// DEV POC — coach-only hub: collab board + content submission
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, Video, FileText, Send, Plus, X,
  ExternalLink, Search, SlidersHorizontal, Clock, Trash2,
  ChevronUp, MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  MOCK_COLLAB_POSTS, MOCK_COACH_CONTENT,
  COLLAB_TYPE_LABELS, COLLAB_TYPE_COLORS,
  type CollabType, type ContentType,
} from './mockData';
import { PocNav } from './PocNav';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LiveCollabPost {
  id: string;
  coach_id: string;
  coach_name: string;
  type: CollabType;
  title: string;
  description: string;
  respond_by: string | null;
  created_at: string;
}

// Unified display type for live + mock posts
interface CollabPostDisplay {
  id: string;
  coach_id: string | null;  // null = mock post
  coach_name: string;
  coach_title?: string;
  type: CollabType;
  title: string;
  description: string;
  respond_by: string | null;
  created_at: string;
  is_mock: boolean;
}

interface LiveContent {
  id: string;
  coach_id: string;
  coach_name: string;
  content_type: ContentType;
  title: string;
  description: string;
  tag: string;
  url?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

const CONTENT_TYPE_ICONS: Record<ContentType, React.ReactNode> = {
  article: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  resource: <BookOpen className="h-4 w-4" />,
};

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  article: 'Article',
  video: 'Video',
  resource: 'Resource / Guide',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRespondByStatus(respondBy: string | null): {
  label: string;
  colorClass: string;
  isOverdue: boolean;
} | null {
  if (!respondBy) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.ceil((new Date(respondBy).getTime() - Date.now()) / msPerDay);
  if (days < 0) return { label: 'Overdue', colorClass: 'bg-red-100 text-red-600', isOverdue: true };
  if (days === 0) return { label: 'Closes today', colorClass: 'bg-red-100 text-red-600', isOverdue: false };
  if (days <= 3) return { label: `${days}d left`, colorClass: 'bg-red-100 text-red-600', isOverdue: false };
  if (days <= 7) return { label: `${days}d left`, colorClass: 'bg-amber-100 text-amber-700', isOverdue: false };
  return {
    label: `Respond by ${new Date(respondBy).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
    colorClass: 'bg-slate-100 text-slate-500',
    isOverdue: false,
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export const CoachHubPOC: React.FC = () => {
  const { coach } = useAuth();
  const [activeTab, setActiveTab] = useState<'collab' | 'content'>('collab');

  // ── Collab board state ────────────────────────────────────────────────────
  const [liveCollabPosts, setLiveCollabPosts] = useState<LiveCollabPost[]>([]);
  const [showCollabForm, setShowCollabForm] = useState(false);
  const [collabType, setCollabType] = useState<CollabType>('podcast_guest');
  const [collabTitle, setCollabTitle] = useState('');
  const [collabDesc, setCollabDesc] = useState('');
  const [collabRespondBy, setCollabRespondBy] = useState('');
  const [collabSubmitting, setCollabSubmitting] = useState(false);

  // Filters
  const [collabSearch, setCollabSearch] = useState('');
  const [collabTypeFilter, setCollabTypeFilter] = useState<CollabType | 'all'>('all');
  const [collabSort, setCollabSort] = useState<'newest' | 'ending_soon'>('newest');
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Digest panel state ───────────────────────────────────────────────────
  const [showDigest, setShowDigest] = useState(false);
  const [digestSince, setDigestSince] = useState<string | null>(null);
  const [digestThreads, setDigestThreads] = useState<{ id: string; slug: string; title: string; upvotes: number }[]>([]);
  const [digestCollabPosts, setDigestCollabPosts] = useState<{ id: string; type: CollabType; title: string; coach_name: string }[]>([]);

  // ── Content hub state ─────────────────────────────────────────────────────
  const [liveContent, setLiveContent] = useState<LiveContent[]>([]);
  const [showContentForm, setShowContentForm] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('article');
  const [contentTitle, setContentTitle] = useState('');
  const [contentDesc, setContentDesc] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [contentTag, setContentTag] = useState('');
  const [contentSubmitting, setContentSubmitting] = useState(false);
  const [contentSuccess, setContentSuccess] = useState(false);

  useEffect(() => {
    if (!coach) return;
    fetchCollabPosts();
    fetchContent();
  }, [coach]);

  // Check for missed activity since last visit
  useEffect(() => {
    if (!coach) return;
    const key = 'cd_coach_hub_last_visit';
    const now = new Date().toISOString();
    const lastVisit = localStorage.getItem(key);
    localStorage.setItem(key, now);

    if (!lastVisit) return; // first visit — nothing to digest
    const daysSince = (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 3) return;

    setDigestSince(lastVisit);
    Promise.all([
      supabase
        .from('community_threads')
        .select('id, slug, title, upvotes')
        .gt('created_at', lastVisit)
        .order('upvotes', { ascending: false })
        .limit(5),
      supabase
        .from('coach_collab_posts')
        .select('id, type, title, coach_name')
        .gt('created_at', lastVisit)
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(([threads, collabs]) => {
      const hasActivity = (threads.data?.length ?? 0) > 0 || (collabs.data?.length ?? 0) > 0;
      if (hasActivity) {
        setDigestThreads(threads.data ?? []);
        setDigestCollabPosts((collabs.data ?? []) as { id: string; type: CollabType; title: string; coach_name: string }[]);
        setShowDigest(true);
      }
    });
  }, [coach]);

  const fetchCollabPosts = async () => {
    const { data } = await supabase
      .from('coach_collab_posts')
      .select('id, coach_id, coach_name, type, title, description, respond_by, created_at')
      .order('created_at', { ascending: false });
    if (data) setLiveCollabPosts(data as LiveCollabPost[]);
  };

  const fetchContent = async () => {
    const { data } = await supabase
      .from('coach_content_submissions')
      .select('id, coach_id, coach_name, content_type, title, description, tag, url, status, rejection_reason, created_at')
      .eq('coach_id', coach?.id ?? '')
      .order('created_at', { ascending: false });
    if (data) setLiveContent(data as LiveContent[]);
  };

  const handleCollabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coach || !collabTitle.trim() || !collabDesc.trim()) return;
    setCollabSubmitting(true);
    const { error } = await supabase.from('coach_collab_posts').insert({
      coach_id: coach.id,
      coach_name: coach.name,
      type: collabType,
      title: collabTitle.trim(),
      description: collabDesc.trim(),
      respond_by: collabRespondBy || null,
    });
    if (!error) {
      setCollabTitle('');
      setCollabDesc('');
      setCollabRespondBy('');
      setShowCollabForm(false);
      fetchCollabPosts();
    }
    setCollabSubmitting(false);
  };

  const handleDeletePost = async (postId: string) => {
    await supabase.from('coach_collab_posts').delete().eq('id', postId);
    setLiveCollabPosts(prev => prev.filter(p => p.id !== postId));
    setConfirmDeleteId(null);
  };

  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coach || !contentTitle.trim() || !contentTag.trim()) return;
    setContentSubmitting(true);
    const { error } = await supabase.from('coach_content_submissions').insert({
      coach_id: coach.id,
      coach_name: coach.name,
      content_type: contentType,
      title: contentTitle.trim(),
      description: contentDesc.trim(),
      body: contentType === 'article' ? contentBody.trim() : null,
      url: contentType !== 'article' ? contentUrl.trim() : null,
      tag: contentTag.trim(),
    });
    if (!error) {
      setContentTitle(''); setContentDesc(''); setContentBody('');
      setContentUrl(''); setContentTag('');
      setShowContentForm(false);
      setContentSuccess(true);
      setTimeout(() => setContentSuccess(false), 5000);
      fetchContent();
    }
    setContentSubmitting(false);
  };

  // ── Combine live + mock posts ──────────────────────────────────────────────

  const allPosts = useMemo((): CollabPostDisplay[] => {
    const live: CollabPostDisplay[] = liveCollabPosts.map(p => ({
      ...p,
      is_mock: false,
    }));
    const mock: CollabPostDisplay[] = MOCK_COLLAB_POSTS.map(p => ({
      id: p.id,
      coach_id: null,
      coach_name: p.coachName,
      coach_title: p.coachTitle,
      type: p.type,
      title: p.title,
      description: p.description,
      respond_by: p.respondBy ?? null,
      created_at: '',
      is_mock: true,
    }));
    return [...live, ...mock];
  }, [liveCollabPosts]);

  // ── Filtered + sorted posts ────────────────────────────────────────────────

  const filteredPosts = useMemo(() => {
    let posts = allPosts;

    if (showMyPosts) {
      posts = posts.filter(p => !p.is_mock && p.coach_id === coach?.id);
    }

    if (collabTypeFilter !== 'all') {
      posts = posts.filter(p => p.type === collabTypeFilter);
    }

    if (collabSearch.trim()) {
      const q = collabSearch.toLowerCase();
      posts = posts.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.coach_name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (collabSort === 'ending_soon') {
      posts = [...posts].sort((a, b) => {
        if (!a.respond_by && !b.respond_by) return 0;
        if (!a.respond_by) return 1;
        if (!b.respond_by) return -1;
        return new Date(a.respond_by).getTime() - new Date(b.respond_by).getTime();
      });
    }

    return posts;
  }, [allPosts, showMyPosts, collabTypeFilter, collabSearch, collabSort, coach?.id]);

  // ── Not a coach ─────────────────────────────────────────────────────────────

  if (!coach) {
    return (
      <>
        <PocNav />
        <div className="min-h-screen bg-slate-50">
          <div className="bg-white border-b border-slate-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#2D8A7E' }}>
                Coach Hub
              </p>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-2">
                For coaches, by coaches.
              </h1>
              <p className="text-slate-500 text-base">
                Post collaboration requests, find peers, and share your content with the community.
              </p>
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex items-center justify-center">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center max-w-md w-full">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: '#E8F5F3' }}
              >
                <Users className="h-7 w-7" style={{ color: '#2D8A7E' }} />
              </div>
              <h2 className="font-display font-bold text-slate-900 text-xl mb-2">
                This area is for coaches
              </h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Log in to your coach account to access the collab board, submit content, and connect with other coaches on CoachDog.
              </p>
              <Link
                to="/coach-login"
                className="inline-block text-sm font-semibold text-white px-6 py-3 rounded-full transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#2D8A7E' }}
              >
                Log in as a Coach →
              </Link>
              <p className="text-xs text-slate-400 mt-4">
                Not a coach yet?{' '}
                <Link to="/coach-signup" className="underline" style={{ color: '#2D8A7E' }}>
                  Apply to join CoachDog
                </Link>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Authenticated coach ──────────────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0]; // min date for respond_by

  return (
    <>
      <PocNav />
      <div className="min-h-screen bg-slate-50">

        {/* Header */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#2D8A7E' }}>
                  Coach Hub
                </p>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                  Welcome, {coach.name.split(' ')[0]}
                </h1>
              </div>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: '#2D8A7E' }}>
                ✓ Verified Coach
              </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-6">
              {(['collab', 'content'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  style={activeTab === tab ? { backgroundColor: '#2D8A7E' } : {}}
                >
                  {tab === 'collab' ? 'Collab Board' : 'Submit Content'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

          {/* ── WELCOME BACK DIGEST ──────────────────────────────────────────── */}
          {showDigest && digestSince && (() => {
            const dayCount = Math.round((Date.now() - new Date(digestSince).getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div className="mb-6 rounded-2xl border-l-4 bg-teal-50 border border-teal-200 p-5" style={{ borderLeftColor: '#2D8A7E' }}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="font-display font-bold text-slate-900 text-base">
                      👋 Welcome back — here's what happened in the last {dayCount} day{dayCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Since your last visit</p>
                  </div>
                  <button
                    onClick={() => setShowDigest(false)}
                    className="text-slate-400 hover:text-slate-600 flex-shrink-0 transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Community questions */}
                  {digestThreads.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Community questions
                      </p>
                      <ul className="space-y-1.5">
                        {digestThreads.map(t => (
                          <li key={t.id}>
                            <Link
                              to={`/insights-poc/${t.slug}`}
                              className="flex items-start justify-between gap-2 text-sm text-slate-700 hover:text-teal-700 transition-colors leading-snug"
                              style={{ color: undefined }}
                            >
                              <span className="line-clamp-1 flex-1">{t.title}</span>
                              {t.upvotes > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-slate-400 flex-shrink-0 mt-0.5">
                                  <ChevronUp className="h-3 w-3" />
                                  {t.upvotes}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/insights-poc"
                        className="inline-block mt-2.5 text-xs font-semibold"
                        style={{ color: '#2D8A7E' }}
                      >
                        View all →
                      </Link>
                    </div>
                  )}

                  {/* Collab requests */}
                  {digestCollabPosts.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Collaboration requests
                      </p>
                      <ul className="space-y-1.5">
                        {digestCollabPosts.map(p => (
                          <li key={p.id} className="text-sm text-slate-700 leading-snug">
                            <span className="font-medium">{COLLAB_TYPE_LABELS[p.type]}</span>
                            <span className="text-slate-400 mx-1">·</span>
                            <span className="line-clamp-1">{p.title}</span>
                            <span className="text-xs text-slate-400 block">by {p.coach_name}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => setActiveTab('collab')}
                        className="inline-block mt-2.5 text-xs font-semibold"
                        style={{ color: '#2D8A7E' }}
                      >
                        Go to Collab Board →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── COLLAB BOARD ─────────────────────────────────────────────────── */}
          {activeTab === 'collab' && (
            <div className="space-y-5">

              {/* Header row */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-display font-bold text-slate-900 text-lg">Collaboration Requests</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {filteredPosts.length} request{filteredPosts.length !== 1 ? 's' : ''} — podcasts, workshops, referrals, and more.
                  </p>
                </div>
                <button
                  onClick={() => setShowCollabForm(v => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-full transition-opacity hover:opacity-90 flex-shrink-0"
                  style={{ backgroundColor: '#2D8A7E' }}
                >
                  {showCollabForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {showCollabForm ? 'Cancel' : 'Post a Request'}
                </button>
              </div>

              {/* ── Post form ── */}
              {showCollabForm && (
                <form onSubmit={handleCollabSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <h3 className="font-display font-bold text-slate-900">New Collaboration Request</h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Type</label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(COLLAB_TYPE_LABELS) as CollabType[]).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setCollabType(t)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                            collabType === t
                              ? 'text-white border-transparent'
                              : 'border-slate-200 text-slate-600 hover:border-slate-400'
                          }`}
                          style={collabType === t ? { backgroundColor: '#2D8A7E' } : {}}
                        >
                          {COLLAB_TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Title</label>
                    <input
                      type="text"
                      required
                      value={collabTitle}
                      onChange={e => setCollabTitle(e.target.value)}
                      placeholder="e.g. Looking for a podcast guest on career transitions"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all"
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                    <textarea
                      required
                      rows={4}
                      value={collabDesc}
                      onChange={e => setCollabDesc(e.target.value)}
                      placeholder="Tell other coaches what you're looking for and what you can offer in return..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all resize-none"
                    />
                  </div>

                  <div className="sm:w-56">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Respond by <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      type="date"
                      min={today}
                      value={collabRespondBy}
                      onChange={e => setCollabRespondBy(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-1">Coaches won't see your request after this date.</p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={collabSubmitting}
                      className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#2D8A7E' }}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {collabSubmitting ? 'Posting…' : 'Post Request'}
                    </button>
                  </div>
                </form>
              )}

              {/* ── Filters ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={collabSearch}
                    onChange={e => setCollabSearch(e.target.value)}
                    placeholder="Search by title, coach name, or keyword…"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all"
                  />
                  {collabSearch && (
                    <button
                      onClick={() => setCollabSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Type pills + sort */}
                <div className="flex flex-wrap items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <button
                    onClick={() => setCollabTypeFilter('all')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      collabTypeFilter === 'all'
                        ? 'text-white border-transparent'
                        : 'border-slate-200 text-slate-500 hover:border-slate-400'
                    }`}
                    style={collabTypeFilter === 'all' ? { backgroundColor: '#2D8A7E' } : {}}
                  >
                    All types
                  </button>
                  {(Object.keys(COLLAB_TYPE_LABELS) as CollabType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setCollabTypeFilter(collabTypeFilter === t ? 'all' : t)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        collabTypeFilter === t
                          ? `${COLLAB_TYPE_COLORS[t]} border-transparent`
                          : 'border-slate-200 text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      {COLLAB_TYPE_LABELS[t]}
                    </button>
                  ))}

                  {/* Sort + My posts — pushed right */}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => setShowMyPosts(v => !v)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        showMyPosts
                          ? 'bg-slate-800 text-white border-transparent'
                          : 'border-slate-200 text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      My Posts
                    </button>
                    <select
                      value={collabSort}
                      onChange={e => setCollabSort(e.target.value as typeof collabSort)}
                      className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-full px-3 py-1.5 focus:outline-none bg-white"
                    >
                      <option value="newest">Newest first</option>
                      <option value="ending_soon">Ending soon</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Post list ── */}
              {filteredPosts.length === 0 ? (
                <div className="text-center py-14 text-slate-400">
                  <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-semibold text-slate-500">No requests match your filters.</p>
                  <button
                    onClick={() => { setCollabSearch(''); setCollabTypeFilter('all'); setShowMyPosts(false); }}
                    className="text-xs mt-2 underline"
                    style={{ color: '#2D8A7E' }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPosts.map(post => {
                    const deadline = getRespondByStatus(post.respond_by);
                    const isOwn = !post.is_mock && post.coach_id === coach.id;
                    const isOverdue = deadline?.isOverdue ?? false;

                    return (
                      <div
                        key={post.id}
                        className={`bg-white rounded-2xl border shadow-sm p-5 sm:p-6 transition-opacity ${
                          isOverdue ? 'opacity-50' : ''
                        } ${isOwn ? 'border-teal-200' : 'border-slate-100'}`}
                      >
                        {/* Top row: type + deadline + close button */}
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${COLLAB_TYPE_COLORS[post.type]}`}>
                              {COLLAB_TYPE_LABELS[post.type]}
                            </span>
                            {deadline && (
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${deadline.colorClass}`}>
                                <Clock className="h-3 w-3" />
                                {deadline.label}
                              </span>
                            )}
                            {isOwn && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700">
                                Your post
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!post.is_mock && (
                              <span className="text-xs text-slate-400">
                                {post.created_at
                                  ? new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                                  : ''}
                              </span>
                            )}
                            {post.is_mock && (
                              <span className="text-xs text-slate-400">{(post as any).createdAt}</span>
                            )}
                            {isOwn && (
                              confirmDeleteId === post.id ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-slate-500">Remove this post?</span>
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-xs font-bold text-red-600 hover:text-red-700"
                                  >
                                    Yes, remove
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-xs text-slate-400 hover:text-slate-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(post.id)}
                                  className="text-slate-300 hover:text-red-400 transition-colors"
                                  title="Close request"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        <h3 className="font-display font-bold text-slate-900 text-base leading-snug mb-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          {post.description}
                        </p>

                        {/* Bottom row: coach + action */}
                        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3 gap-2">
                          <div>
                            <span className="font-semibold text-slate-700">{post.coach_name}</span>
                            {post.coach_title && (
                              <span className="ml-2 text-slate-400">{post.coach_title}</span>
                            )}
                          </div>
                          {!isOwn && post.coach_id && (
                            <Link
                              to={`/coach/${post.coach_id}`}
                              className="flex items-center gap-1 font-semibold text-xs hover:opacity-80 transition-opacity"
                              style={{ color: '#2D8A7E' }}
                            >
                              View Profile <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── SUBMIT CONTENT ────────────────────────────────────────────────── */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-slate-900 text-lg">Coach Contributions</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Share your articles, videos, and resources with the CoachDog community.</p>
                </div>
                <button
                  onClick={() => setShowContentForm(v => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-full transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#2D8A7E' }}
                >
                  {showContentForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {showContentForm ? 'Cancel' : 'Submit Content'}
                </button>
              </div>

              {contentSuccess && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm font-semibold text-amber-700">
                  ✓ Submitted — your content is under review and will go live once approved.
                </div>
              )}

              {/* Content form */}
              {showContentForm && (
                <form onSubmit={handleContentSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <h3 className="font-display font-bold text-slate-900">Submit Content</h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Content type</label>
                    <div className="flex gap-2">
                      {(['article', 'video', 'resource'] as ContentType[]).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setContentType(t)}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                            contentType === t
                              ? 'text-white border-transparent'
                              : 'border-slate-200 text-slate-600 hover:border-slate-400'
                          }`}
                          style={contentType === t ? { backgroundColor: '#2D8A7E' } : {}}
                        >
                          {CONTENT_TYPE_ICONS[t]}
                          {CONTENT_TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Title</label>
                    <input
                      type="text"
                      required
                      value={contentTitle}
                      onChange={e => setContentTitle(e.target.value)}
                      placeholder={
                        contentType === 'article'
                          ? 'e.g. How to negotiate a pay rise in 3 emails'
                          : contentType === 'video'
                          ? 'e.g. 5 signs you need a coach, not a mentor'
                          : 'e.g. Weekly reset planning template'
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Short description</label>
                    <textarea
                      required
                      rows={2}
                      value={contentDesc}
                      onChange={e => setContentDesc(e.target.value)}
                      placeholder="One or two sentences explaining what this is and who it's for..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all resize-none"
                    />
                  </div>

                  {contentType === 'article' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Article body</label>
                      <textarea
                        required
                        rows={8}
                        value={contentBody}
                        onChange={e => setContentBody(e.target.value)}
                        placeholder="Write your article here..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all resize-none"
                      />
                    </div>
                  )}

                  {(contentType === 'video' || contentType === 'resource') && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        {contentType === 'video' ? 'YouTube or Vimeo URL' : 'Link'}
                      </label>
                      <input
                        type="url"
                        required
                        value={contentUrl}
                        onChange={e => setContentUrl(e.target.value)}
                        placeholder={contentType === 'video' ? 'https://youtube.com/watch?v=...' : 'https://...'}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Topic tag</label>
                    <input
                      type="text"
                      required
                      value={contentTag}
                      onChange={e => setContentTag(e.target.value)}
                      placeholder="e.g. Salary Negotiation, Leadership, Productivity"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={contentSubmitting}
                      className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#2D8A7E' }}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {contentSubmitting ? 'Submitting…' : 'Submit'}
                    </button>
                  </div>
                </form>
              )}

              {/* Live submissions — coach sees their own with status */}
              {liveContent.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Your submissions</p>
                  {liveContent.map(item => (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl border shadow-sm p-5 ${
                        item.status === 'rejected'
                          ? 'border-red-200'
                          : item.status === 'pending'
                          ? 'border-amber-200'
                          : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <div>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1">
                            {CONTENT_TYPE_ICONS[item.content_type as ContentType]}
                            {CONTENT_TYPE_LABELS[item.content_type as ContentType]}
                          </span>
                          <p className="font-display font-bold text-slate-900 text-sm leading-snug">{item.title}</p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                            item.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : item.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.status === 'approved'
                            ? '✓ Live'
                            : item.status === 'rejected'
                            ? 'Not approved'
                            : 'Under review'}
                        </span>
                      </div>
                      {item.status === 'rejected' && item.rejection_reason && (
                        <div className="mt-2 bg-red-50 rounded-xl px-3 py-2 text-xs text-red-700 leading-relaxed">
                          <span className="font-semibold">Feedback: </span>
                          {item.rejection_reason}
                          <button
                            className="block mt-1.5 font-semibold underline"
                            style={{ color: '#2D8A7E' }}
                            onClick={() => setShowContentForm(true)}
                          >
                            Revise &amp; Resubmit →
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Mock content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_COACH_CONTENT.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        {CONTENT_TYPE_ICONS[item.contentType]}
                        {CONTENT_TYPE_LABELS[item.contentType]}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {item.tag}
                      </span>
                    </div>
                    <p className="font-display font-bold text-slate-900 text-sm leading-snug mb-2">{item.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{item.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-3">
                      <div>
                        <span className="font-medium text-slate-600">{item.coachName}</span>
                        <span className="ml-1.5">{item.coachTitle}</span>
                      </div>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                          style={{ color: '#2D8A7E' }}
                        >
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};
