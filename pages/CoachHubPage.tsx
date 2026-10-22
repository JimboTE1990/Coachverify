import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Send, Plus, X, ExternalLink,
  Search, SlidersHorizontal, Clock, Trash2,
  ChevronUp, MessageCircle, Heart, Bookmark,
  MessageSquare, CheckCircle, AlertCircle, Pencil,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
type CollabType = 'podcast_guest' | 'co_host' | 'referral_partner' | 'accountability' | 'content_collab' | 'other';

const COLLAB_TYPE_LABELS: Record<CollabType, string> = {
  podcast_guest: 'Podcast Guest',
  co_host: 'Webinar Co-host',
  referral_partner: 'Referral Partner',
  accountability: 'Accountability Partner',
  content_collab: 'Content Collaboration',
  other: 'Other',
};

const COLLAB_TYPE_COLORS: Record<CollabType, string> = {
  podcast_guest: 'bg-purple-100 text-purple-700',
  co_host: 'bg-blue-100 text-blue-700',
  referral_partner: 'bg-emerald-100 text-emerald-700',
  accountability: 'bg-amber-100 text-amber-700',
  content_collab: 'bg-teal-100 text-teal-700',
  other: 'bg-slate-100 text-slate-600',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface LiveCollabPost {
  id: string;
  coach_id: string;
  coach_name: string;
  type: CollabType;
  title: string;
  description: string;
  respond_by: string | null;
  status: 'active' | 'fulfilled';
  created_at: string;
}

interface CollabPostDisplay {
  id: string;
  coach_id: string | null;
  coach_name: string;
  coach_title?: string;
  coach_photo_url?: string | null;
  type: CollabType;
  title: string;
  description: string;
  respond_by: string | null;
  status: 'active' | 'fulfilled';
  created_at: string;
  is_coach_active: boolean;
}

interface CollabComment {
  id: string;
  post_id: string;
  coach_id: string | null;
  coach_name: string;
  body: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRespondByStatus(respondBy: string | null): { label: string; colorClass: string; isOverdue: boolean } | null {
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

// ── Component ─────────────────────────────────────────────────────────────────

export const CoachHubPage: React.FC = () => {
  const { coach } = useAuth();

  // ── Collab posts ──────────────────────────────────────────────────────────
  const [liveCollabPosts, setLiveCollabPosts] = useState<LiveCollabPost[]>([]);
  const [showCollabForm, setShowCollabForm] = useState(false);
  const [collabType, setCollabType] = useState<CollabType>('podcast_guest');
  const [collabTitle, setCollabTitle] = useState('');
  const [collabDesc, setCollabDesc] = useState('');
  const [collabRespondBy, setCollabRespondBy] = useState('');
  const [collabSubmitting, setCollabSubmitting] = useState(false);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [collabSearch, setCollabSearch] = useState('');
  const [collabTypeFilter, setCollabTypeFilter] = useState<CollabType | 'all'>('all');
  const [collabSort, setCollabSort] = useState<'newest' | 'ending_soon'>('newest');
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showFulfilled, setShowFulfilled] = useState(false);

  // ── Post actions ──────────────────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [fulfillConfirmId, setFulfillConfirmId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<CollabType>('podcast_guest');
  const [editRespondBy, setEditRespondBy] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── Social interactions (localStorage) ───────────────────────────────────
  const [likedPosts, setLikedPosts] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('cd_collab_likes') ?? '[]')); }
    catch { return new Set(); }
  });
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('cd_collab_bookmarks') ?? '[]')); }
    catch { return new Set(); }
  });

  // ── Comments ──────────────────────────────────────────────────────────────
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Map<string, CollabComment[]>>(new Map());
  const [commentCounts, setCommentCounts] = useState<Map<string, number>>(new Map());
  const [newCommentText, setNewCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // ── Inactive coaches + photos ─────────────────────────────────────────────
  const [expiredCoachIds, setExpiredCoachIds] = useState<Set<string>>(new Set());
  const [coachPhotoMap, setCoachPhotoMap] = useState<Map<string, string | null>>(new Map());

  // ── Digest ────────────────────────────────────────────────────────────────
  const [showDigest, setShowDigest] = useState(false);
  const [digestSince, setDigestSince] = useState<string | null>(null);
  const [digestThreads, setDigestThreads] = useState<{ id: string; slug: string; title: string; upvotes: number }[]>([]);
  const [digestCollabPosts, setDigestCollabPosts] = useState<{ id: string; type: CollabType; title: string; coach_name: string }[]>([]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!coach) return;
    fetchCollabPosts();
  }, [coach]);

  useEffect(() => {
    if (!coach) return;
    const key = 'cd_coach_hub_last_visit';
    const now = new Date().toISOString();
    const lastVisit = localStorage.getItem(key);
    localStorage.setItem(key, now);

    if (!lastVisit) return;
    const daysSince = (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 3) return;

    setDigestSince(lastVisit);
    Promise.all([
      supabase.from('community_threads').select('id, slug, title, upvotes').gt('created_at', lastVisit).order('upvotes', { ascending: false }).limit(5),
      supabase.from('coach_collab_posts').select('id, type, title, coach_name').gt('created_at', lastVisit).order('created_at', { ascending: false }).limit(5),
    ]).then(([threads, collabs]) => {
      const hasActivity = (threads.data?.length ?? 0) > 0 || (collabs.data?.length ?? 0) > 0;
      if (hasActivity) {
        setDigestThreads(threads.data ?? []);
        setDigestCollabPosts((collabs.data ?? []) as { id: string; type: CollabType; title: string; coach_name: string }[]);
        setShowDigest(true);
      }
    });
  }, [coach]);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchCollabPosts = async () => {
    const { data: posts } = await supabase
      .from('coach_collab_posts')
      .select('id, coach_id, coach_name, type, title, description, respond_by, status, created_at')
      .order('created_at', { ascending: false });

    if (!posts) return;
    setLiveCollabPosts(posts as LiveCollabPost[]);

    const postIds = posts.map(p => p.id);
    if (postIds.length > 0) {
      const { data: commentRows } = await supabase
        .from('coach_collab_comments')
        .select('post_id')
        .in('post_id', postIds);
      const counts = new Map<string, number>();
      commentRows?.forEach(r => counts.set(r.post_id, (counts.get(r.post_id) ?? 0) + 1));
      setCommentCounts(counts);
    }

    const coachIds = [...new Set(posts.map(p => p.coach_id))];
    if (coachIds.length > 0) {
      const { data: coachRows } = await supabase
        .from('coaches')
        .select('id, subscription_status, photo_url')
        .in('id', coachIds);
      const expired = new Set<string>(
        (coachRows ?? [])
          .filter((c: any) => c.subscription_status === 'expired')
          .map((c: any) => c.id as string)
      );
      const photos = new Map<string, string | null>(
        (coachRows ?? []).map((c: any) => [c.id as string, (c.photo_url as string | null) ?? null])
      );
      setExpiredCoachIds(expired);
      setCoachPhotoMap(photos);
    }
  };

  const loadComments = async (postId: string) => {
    if (postComments.has(postId)) return;
    const { data } = await supabase
      .from('coach_collab_comments')
      .select('id, post_id, coach_id, coach_name, body, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setPostComments(prev => new Map(prev).set(postId, (data ?? []) as CollabComment[]));
  };

  // ── Actions ───────────────────────────────────────────────────────────────

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
    if (error) {
      console.error('[CoachHub] Insert error:', error.code, error.message, error.details);
    } else {
      setCollabTitle(''); setCollabDesc(''); setCollabRespondBy('');
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

  const handleFulfillPost = async (postId: string) => {
    const { error } = await supabase
      .from('coach_collab_posts')
      .update({ status: 'fulfilled' })
      .eq('id', postId);
    if (!error) {
      setLiveCollabPosts(prev =>
        prev.map(p => p.id === postId ? { ...p, status: 'fulfilled' } : p)
      );
    }
    setFulfillConfirmId(null);
  };

  const handleReopenPost = async (postId: string) => {
    const { error } = await supabase
      .from('coach_collab_posts')
      .update({ status: 'active' })
      .eq('id', postId);
    if (!error) {
      setLiveCollabPosts(prev =>
        prev.map(p => p.id === postId ? { ...p, status: 'active' } : p)
      );
    }
  };

  const handleStartEdit = (post: CollabPostDisplay) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditDesc(post.description);
    setEditType(post.type);
    setEditRespondBy(post.respond_by ?? '');
    setFulfillConfirmId(null);
    setConfirmDeleteId(null);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editTitle.trim() || !editDesc.trim()) return;
    setEditSubmitting(true);
    const { error } = await supabase
      .from('coach_collab_posts')
      .update({
        type: editType,
        title: editTitle.trim(),
        description: editDesc.trim(),
        respond_by: editRespondBy || null,
      })
      .eq('id', postId);
    if (error) {
      console.error('[CoachHub] Edit error:', error.message);
    } else {
      setLiveCollabPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, type: editType, title: editTitle.trim(), description: editDesc.trim(), respond_by: editRespondBy || null }
          : p
      ));
      setEditingPostId(null);
    }
    setEditSubmitting(false);
  };

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      try { localStorage.setItem('cd_collab_likes', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const handleBookmark = (postId: string) => {
    setBookmarkedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      try { localStorage.setItem('cd_collab_bookmarks', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const handleToggleComments = (postId: string, isMock: boolean) => {
    if (isMock) return;
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      loadComments(postId);
      setTimeout(() => commentInputRef.current?.focus(), 150);
    }
    setNewCommentText('');
  };

  const handleSubmitComment = async (postId: string) => {
    if (!coach || !newCommentText.trim()) return;
    setCommentSubmitting(true);
    const { data, error } = await supabase
      .from('coach_collab_comments')
      .insert({
        post_id: postId,
        coach_id: coach.id,
        coach_name: coach.name,
        body: newCommentText.trim(),
      })
      .select()
      .single();
    if (!error && data) {
      setPostComments(prev => {
        const updated = new Map(prev);
        updated.set(postId, [...(updated.get(postId) ?? []), data as CollabComment]);
        return updated;
      });
      setCommentCounts(prev => new Map(prev).set(postId, (prev.get(postId) ?? 0) + 1));
      setNewCommentText('');
    }
    setCommentSubmitting(false);
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const allPosts = useMemo((): CollabPostDisplay[] =>
    liveCollabPosts.map(p => ({
      ...p,
      is_coach_active: !expiredCoachIds.has(p.coach_id),
      coach_photo_url: coachPhotoMap.get(p.coach_id) ?? null,
    })),
  [liveCollabPosts, expiredCoachIds, coachPhotoMap]);

  const fulfilledCount = useMemo(
    () => liveCollabPosts.filter(p => p.status === 'fulfilled').length,
    [liveCollabPosts]
  );

  const filteredPosts = useMemo(() => {
    let posts = allPosts;
    if (!showFulfilled) posts = posts.filter(p => p.status !== 'fulfilled');
    if (showMyPosts) posts = posts.filter(p => p.coach_id === coach?.id);
    if (collabTypeFilter !== 'all') posts = posts.filter(p => p.type === collabTypeFilter);
    if (collabSearch.trim()) {
      const q = collabSearch.toLowerCase();
      posts = posts.filter(p =>
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
  }, [allPosts, showFulfilled, showMyPosts, collabTypeFilter, collabSearch, collabSort, coach?.id]);

  // ── Auth gate ─────────────────────────────────────────────────────────────

  if (!coach) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#2D8A7E' }}>Coach Hub</p>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-2">For coaches, by coaches.</h1>
            <p className="text-slate-500 text-base">A private space for accredited CoachDog coaches to collaborate, share, and connect.</p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex items-center justify-center">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center max-w-md w-full">
            <div className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#E8F5F3' }}>
              <Users className="h-7 w-7" style={{ color: '#2D8A7E' }} />
            </div>
            <h2 className="font-display font-bold text-slate-900 text-xl mb-2">This area is for coaches</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Log in to your CoachDog coach account to access the collaboration board and connect with other coaches.
            </p>
            <Link to="/coach-login" className="inline-block text-sm font-semibold text-white px-6 py-3 rounded-full transition-opacity hover:opacity-90" style={{ backgroundColor: '#2D8A7E' }}>
              Log in as a Coach →
            </Link>
            <p className="text-xs text-slate-400 mt-4">
              Not on CoachDog yet?{' '}
              <Link to="/coach-signup" className="underline" style={{ color: '#2D8A7E' }}>Apply to join</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#2D8A7E' }}>Coach Hub</p>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">Welcome, {coach.name.split(' ')[0]}</h1>
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: '#2D8A7E' }}>✓ Verified Coach</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Digest panel */}
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
                <button onClick={() => setShowDigest(false)} className="text-slate-400 hover:text-slate-600 flex-shrink-0 transition-colors" aria-label="Dismiss">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {digestThreads.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5" /> Community questions
                    </p>
                    <ul className="space-y-1.5">
                      {digestThreads.map(t => (
                        <li key={t.id}>
                          <Link to={`/community/${t.slug}`} className="flex items-start justify-between gap-2 text-sm text-slate-700 hover:text-teal-700 transition-colors leading-snug">
                            <span className="line-clamp-1 flex-1">{t.title}</span>
                            {t.upvotes > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-slate-400 flex-shrink-0 mt-0.5">
                                <ChevronUp className="h-3 w-3" />{t.upvotes}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link to="/community" className="inline-block mt-2.5 text-xs font-semibold" style={{ color: '#2D8A7E' }}>View all →</Link>
                  </div>
                )}
                {digestCollabPosts.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Collaboration requests
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
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Collab board */}
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display font-bold text-slate-900 text-lg">Collaboration Requests</h2>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed max-w-xl">
                A space to request collaboration with a fellow accredited CoachDog coach, whether that's finding a podcast guest, a content co-creator, a webinar host or something else entirely.
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

          {/* New request form */}
          {showCollabForm && (
            <form onSubmit={handleCollabSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="font-display font-bold text-slate-900">New Collaboration Request</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Type</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(COLLAB_TYPE_LABELS) as CollabType[]).map(t => (
                    <button key={t} type="button" onClick={() => setCollabType(t)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${collabType === t ? 'text-white border-transparent' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
                      style={collabType === t ? { backgroundColor: '#2D8A7E' } : {}}
                    >
                      {COLLAB_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Title</label>
                <input type="text" required value={collabTitle} onChange={e => setCollabTitle(e.target.value)} placeholder="e.g. Looking for a podcast guest on career transitions" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all" maxLength={200} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                <textarea required rows={5} value={collabDesc} onChange={e => setCollabDesc(e.target.value)} placeholder="Tell other coaches what you're looking for and what you can offer in return. Press Enter twice to start a new paragraph." className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all resize-y" />
              </div>
              <div className="sm:w-56">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Respond by <span className="font-normal text-slate-400">(optional)</span></label>
                <input type="date" min={today} value={collabRespondBy} onChange={e => setCollabRespondBy(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all" />
                <p className="text-xs text-slate-400 mt-1">Your request will expire after this date.</p>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={collabSubmitting} className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#2D8A7E' }}>
                  <Send className="h-3.5 w-3.5" />
                  {collabSubmitting ? 'Posting…' : 'Post Request'}
                </button>
              </div>
            </form>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" value={collabSearch} onChange={e => setCollabSearch(e.target.value)} placeholder="Search by title, coach name, or keyword…" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all" />
              {collabSearch && (
                <button onClick={() => setCollabSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <button onClick={() => setCollabTypeFilter('all')} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${collabTypeFilter === 'all' ? 'text-white border-transparent' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`} style={collabTypeFilter === 'all' ? { backgroundColor: '#2D8A7E' } : {}}>All types</button>
              {(Object.keys(COLLAB_TYPE_LABELS) as CollabType[]).map(t => (
                <button key={t} onClick={() => setCollabTypeFilter(collabTypeFilter === t ? 'all' : t)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${collabTypeFilter === t ? `${COLLAB_TYPE_COLORS[t]} border-transparent` : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}
                >
                  {COLLAB_TYPE_LABELS[t]}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                <button onClick={() => setShowMyPosts(v => !v)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${showMyPosts ? 'bg-slate-800 text-white border-transparent' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>My Posts</button>
                {fulfilledCount > 0 && (
                  <button onClick={() => setShowFulfilled(v => !v)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${showFulfilled ? 'bg-emerald-600 text-white border-transparent' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                    <CheckCircle className="h-3 w-3" /> Fulfilled ({fulfilledCount})
                  </button>
                )}
                <select value={collabSort} onChange={e => setCollabSort(e.target.value as typeof collabSort)} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-full px-3 py-1.5 focus:outline-none bg-white">
                  <option value="newest">Newest first</option>
                  <option value="ending_soon">Ending soon</option>
                </select>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 px-1">
            {filteredPosts.length} request{filteredPosts.length !== 1 ? 's' : ''}
            {(collabSearch || collabTypeFilter !== 'all' || showMyPosts) ? ' matching your filters' : ''}
          </p>

          {/* Post list */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold text-slate-500">No requests match your filters.</p>
              <button onClick={() => { setCollabSearch(''); setCollabTypeFilter('all'); setShowMyPosts(false); }} className="text-xs mt-2 underline" style={{ color: '#2D8A7E' }}>Clear filters</button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map(post => {
                const deadline = getRespondByStatus(post.respond_by);
                const isOwn = post.coach_id === coach.id;
                const isOverdue = deadline?.isOverdue ?? false;
                const isFulfilled = post.status === 'fulfilled';
                const isInactive = !post.is_coach_active;
                const isExpanded = expandedPostId === post.id;
                const commentCount = commentCounts.get(post.id) ?? 0;
                const comments = postComments.get(post.id) ?? [];
                const isLiked = likedPosts.has(post.id);
                const isBookmarked = bookmarkedPosts.has(post.id);

                return (
                  <div key={post.id}
                    className={`bg-white rounded-2xl border shadow-sm transition-opacity ${isOverdue || isFulfilled ? 'opacity-60' : ''} ${isOwn ? 'border-teal-200' : 'border-slate-100'}`}
                  >
                    <div className="p-5 sm:p-6">
                      {/* Inactive banner */}
                      {isInactive && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          Posted by an inactive coach account — content is still visible
                        </div>
                      )}

                      {/* X-style layout: avatar left, content right */}
                      <div className="flex gap-3 sm:gap-4">

                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {post.coach_photo_url ? (
                            <Link to={post.coach_id ? `/coach/${post.coach_id}` : '#'} tabIndex={post.coach_id ? undefined : -1}>
                              <img
                                src={post.coach_photo_url}
                                alt={post.coach_name}
                                className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                              />
                            </Link>
                          ) : (
                            <div className="h-12 w-12 rounded-full flex items-center justify-center text-base font-bold text-white shadow-sm flex-shrink-0" style={{ backgroundColor: '#2D8A7E' }}>
                              {post.coach_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Content column */}
                        <div className="flex-1 min-w-0">

                          {/* Coach name row */}
                          <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              {post.coach_id && !post.is_mock ? (
                                <Link to={`/coach/${post.coach_id}`} className="font-bold text-slate-900 text-sm hover:underline leading-tight">
                                  {post.coach_name}
                                </Link>
                              ) : (
                                <span className="font-bold text-slate-900 text-sm leading-tight">{post.coach_name}</span>
                              )}
                              {post.coach_title && <span className="text-xs text-slate-400 hidden sm:block truncate">{post.coach_title}</span>}
                              {post.created_at && (
                                <span className="text-xs text-slate-400">· {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                              )}
                            </div>

                            {/* Own post controls */}
                            {isOwn && editingPostId !== post.id && (
                              <div className="flex items-center gap-1.5 flex-shrink-0 text-xs">
                                {isFulfilled && (
                                  <button onClick={() => handleReopenPost(post.id)} className="flex items-center gap-1 font-semibold px-2 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                                    Re-open
                                  </button>
                                )}
                                {!isFulfilled && (
                                  fulfillConfirmId === post.id ? (
                                    <>
                                      <span className="text-slate-500">Fulfilled?</span>
                                      <button onClick={() => handleFulfillPost(post.id)} className="font-bold text-emerald-600">Yes</button>
                                      <button onClick={() => setFulfillConfirmId(null)} className="text-slate-400">No</button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => handleStartEdit(post)} className="flex items-center gap-1 font-semibold px-2 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                                        <Pencil className="h-3 w-3" /> Edit
                                      </button>
                                      <button onClick={() => setFulfillConfirmId(post.id)} className="flex items-center gap-1 font-semibold px-2 py-1 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors">
                                        <CheckCircle className="h-3 w-3" /> Fulfilled
                                      </button>
                                    </>
                                  )
                                )}
                                {confirmDeleteId === post.id ? (
                                  <>
                                    <span className="text-slate-500">Remove?</span>
                                    <button onClick={() => handleDeletePost(post.id)} className="font-bold text-red-600">Yes</button>
                                    <button onClick={() => setConfirmDeleteId(null)} className="text-slate-400">No</button>
                                  </>
                                ) : (
                                  <button onClick={() => setConfirmDeleteId(post.id)} className="text-slate-300 hover:text-red-400 transition-colors" title="Remove">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${COLLAB_TYPE_COLORS[post.type]}`}>{COLLAB_TYPE_LABELS[post.type]}</span>
                            {isFulfilled ? (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Fulfilled
                              </span>
                            ) : (
                              deadline && (
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${deadline.colorClass}`}>
                                  <Clock className="h-3 w-3" />{deadline.label}
                                </span>
                              )
                            )}
                            {isOwn && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700">Your post</span>}
                          </div>

                          {/* Content — edit form or read view */}
                          {editingPostId === post.id ? (
                            <div className="space-y-3 mb-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Type</label>
                                <div className="flex flex-wrap gap-2">
                                  {(Object.keys(COLLAB_TYPE_LABELS) as CollabType[]).map(t => (
                                    <button key={t} type="button" onClick={() => setEditType(t)}
                                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${editType === t ? 'text-white border-transparent' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
                                      style={editType === t ? { backgroundColor: '#2D8A7E' } : {}}
                                    >
                                      {COLLAB_TYPE_LABELS[t]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Title</label>
                                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all" maxLength={200} />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
                                <textarea rows={6} value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all resize-y" placeholder="Describe your request in as much detail as needed. Press Enter twice to start a new paragraph." />
                              </div>
                              <div className="sm:w-48">
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Respond by</label>
                                <input type="date" min={today} value={editRespondBy} onChange={e => setEditRespondBy(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all" />
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <button onClick={() => handleSaveEdit(post.id)} disabled={editSubmitting || !editTitle.trim() || !editDesc.trim()} className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-full transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#2D8A7E' }}>
                                  <Send className="h-3 w-3" />{editSubmitting ? 'Saving…' : 'Save changes'}
                                </button>
                                <button onClick={handleCancelEdit} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-display font-bold text-slate-900 text-base leading-snug mb-1.5">{post.title}</h3>
                              <p className="text-sm text-slate-600 leading-relaxed mb-3 whitespace-pre-wrap">{post.description}</p>
                            </>
                          )}

                          {/* Social bar */}
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${isLiked ? 'bg-rose-50 text-rose-600' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`} title={isLiked ? 'Unlike' : 'Like'}>
                              <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                            </button>
                            <button onClick={() => handleBookmark(post.id)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${isBookmarked ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`} title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}>
                              <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                            </button>
                            <button onClick={() => handleToggleComments(post.id, false)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${isExpanded ? 'bg-teal-50 text-teal-700' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`} title={isExpanded ? 'Hide comments' : 'Comments'}>
                              <MessageSquare className="h-3.5 w-3.5" />
                              {commentCount > 0 && <span>{commentCount}</span>}
                            </button>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* Comment section */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50 rounded-b-2xl px-5 sm:px-6 py-4 space-y-4">
                        {comments.length > 0 ? (
                          <div className="space-y-3">
                            {comments.map(comment => {
                              const commentInactive = comment.coach_id ? expiredCoachIds.has(comment.coach_id) : false;
                              return (
                                <div key={comment.id} className={`flex gap-3 ${commentInactive ? 'opacity-60' : ''}`}>
                                  <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white mt-0.5" style={{ backgroundColor: '#2D8A7E' }}>
                                    {comment.coach_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                      <span className="text-xs font-bold text-slate-800">{comment.coach_name}</span>
                                      {commentInactive && (
                                        <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Inactive account</span>
                                      )}
                                      <span className="text-xs text-slate-400">
                                        {new Date(comment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">{comment.body}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 text-center py-1">No comments yet — be the first.</p>
                        )}

                        <div className="flex gap-3 items-start pt-1 border-t border-slate-200">
                          <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white mt-2" style={{ backgroundColor: '#2D8A7E' }}>
                            {coach.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 flex gap-2 pt-1">
                            <textarea
                              ref={commentInputRef}
                              rows={2}
                              value={newCommentText}
                              onChange={e => setNewCommentText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitComment(post.id);
                              }}
                              placeholder="Add a comment… (⌘↵ to post)"
                              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 resize-none transition-all"
                            />
                            <button
                              onClick={() => handleSubmitComment(post.id)}
                              disabled={!newCommentText.trim() || commentSubmitting}
                              className="self-end flex items-center px-3 py-2 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40 text-white"
                              style={{ backgroundColor: '#2D8A7E' }}
                              title="Post comment"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
