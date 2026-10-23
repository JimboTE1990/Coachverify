import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MessageCircle, ChevronUp, ArrowRight, Bookmark, BookmarkX, Mic, MicOff, ChevronDown, Tag, CheckCircle } from 'lucide-react';
import { THREADS } from '../components/experimental/mockData';
import { AskQuestionModal } from '../components/experimental/AskQuestionModal';
import { supabase } from '../lib/supabase';
import { usePageMeta } from '../utils/usePageMeta';
import { useAuth } from '../hooks/useAuth';
import { COMMUNITY_TAGS, COMMUNITY_TAG_COLORS, matchSearchToTag, type CommunityTag } from '../constants/communityTags';

interface LiveThread {
  id: string;
  slug: string;
  title: string;
  author_name: string;
  tag: string;
  upvotes: number;
  created_at: string;
  community_replies: { id: string; coach_id: string | null }[];
}

function slugify(title: string): string {
  return (
    title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) +
    '-' + Date.now().toString(36)
  );
}

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { coach } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [showAskModal, setShowAskModal] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState<CommunityTag | null>(null);
  const [sortMode, setSortMode] = useState<'newest' | 'most_liked' | 'most_comments'>('newest');
  const [postingQuestion, setPostingQuestion] = useState(false);
  const [postError, setPostError] = useState('');
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string; body: string | null; author_name: string;
    author_email: string; anonymous: boolean; tag?: string;
  } | null>(null);
  const confirmedUserIdRef = useRef<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  // Capture ?q= immediately on mount before Supabase's PKCE flow can strip URL params
  const pendingQRef = useRef<string | null>(new URLSearchParams(window.location.search).get('q'));
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const recognitionRef = useRef<any>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [liveThreads, setLiveThreads] = useState<LiveThread[]>([]);
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('cd_community_bookmarks') ?? '[]')); }
    catch { return new Set(); }
  });

  usePageMeta({
    title: 'Community Q&A | CoachDog',
    description: 'Real coaching questions answered by verified, accredited coaches. Browse topics, ask your own question, and get expert guidance.',
    canonical: 'https://www.coachdog.co.uk/community',
  });

  const fetchLiveThreads = async () => {
    const { data: threads } = await supabase
      .from('community_threads')
      .select('id, slug, title, author_name, tag, upvotes, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!threads) return;

    const slugs = threads.map(t => t.slug);
    const { data: replies } = await supabase
      .from('community_replies')
      .select('thread_slug, id, coach_id')
      .in('thread_slug', slugs);

    const replyMap = new Map<string, { id: string; coach_id: string | null }[]>();
    replies?.forEach(r => {
      const arr = replyMap.get(r.thread_slug) ?? [];
      arr.push({ id: r.id, coach_id: r.coach_id });
      replyMap.set(r.thread_slug, arr);
    });

    setLiveThreads(threads.map(t => ({ ...t, community_replies: replyMap.get(t.slug) ?? [] })));
  };

  // Decode a ?q= payload and surface the confirmation UI — does NOT post yet
  const showPendingConfirm = (userId: string) => {
    const encoded = pendingQRef.current;
    if (!encoded) return;
    pendingQRef.current = null;
    try {
      const pending = JSON.parse(atob(encoded));
      confirmedUserIdRef.current = userId;
      setPendingConfirm(pending);
    } catch {}
  };

  // Called when the user taps "Post my question" in the confirmation UI
  const handleConfirmPost = async () => {
    if (!pendingConfirm || !confirmedUserIdRef.current) return;
    setPostingQuestion(true);
    setPostError('');
    try {
      const displayName = pendingConfirm.anonymous ? 'Anonymous' : pendingConfirm.author_name;
      await supabase.from('community_users').upsert(
        { user_id: confirmedUserIdRef.current, display_name: displayName, marketing_opt_in: false },
        { onConflict: 'user_id' }
      );
      const slug = slugify(pendingConfirm.title);
      const { error } = await supabase.from('community_threads').insert({
        slug,
        title: pendingConfirm.title,
        body: pendingConfirm.body,
        author_name: displayName,
        author_email: pendingConfirm.author_email,
        user_id: confirmedUserIdRef.current,
        tag: pendingConfirm.tag ?? 'Career',
      });
      if (!error) {
        navigate(`/community/${slug}`);
      } else {
        setPostError('Something went wrong posting your question. Please try submitting it again.');
        setPostingQuestion(false);
      }
    } catch {
      setPostError('Something went wrong posting your question. Please try submitting it again.');
      setPostingQuestion(false);
    }
  };

  useEffect(() => {
    const w = window as any;
    if (w.SpeechRecognition || w.webkitSpeechRecognition) setVoiceSupported(true);
  }, []);

  const handleVoiceSearch = () => {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    try {
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-GB';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let interim = '', final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t; else interim += t;
        }
        setSearchValue(final || interim);
        if (final) setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch { setIsListening(false); }
  };

  useEffect(() => {
    fetchLiveThreads();

    // Coaches get bookmarks from DB (persistent, cross-device)
    if (coach?.user_id) {
      supabase.from('community_bookmarks').select('thread_slug').eq('user_id', coach.user_id)
        .then(({ data }) => { if (data) setBookmarkedSlugs(new Set(data.map(b => b.thread_slug))); });
    }
  }, [coach?.user_id]);

  useEffect(() => {
    let showed = false;
    const tryShow = (userId: string) => {
      if (showed) return;
      showed = true;
      showPendingConfirm(userId);
    };

    // Check for an existing session immediately — skips the magic link step for
    // users who are already authenticated (returning community user / "temp login")
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) tryShow(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        tryShow(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleQuestionPosted = (slug: string) => {
    setShowAskModal(false);
    navigate(`/community/${slug}`);
  };

  const hasCoachReply = (slug: string) => {
    const thread = THREADS.find(t => t.slug === slug);
    return thread?.replies.some(r => r.isCoach) ?? false;
  };

  const filteredMockThreads = showBookmarksOnly
    ? THREADS.filter(t => bookmarkedSlugs.has(t.slug)).filter(t =>
        !searchValue.trim() ||
        t.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        t.author.toLowerCase().includes(searchValue.toLowerCase())
      )
    : searchValue.trim()
      ? THREADS.filter(t =>
          t.title.toLowerCase().includes(searchValue.toLowerCase()) ||
          t.author.toLowerCase().includes(searchValue.toLowerCase())
        )
      : THREADS;

  // Smart search: if the query maps to a tag, auto-apply it
  const smartTag = searchValue.trim() ? matchSearchToTag(searchValue) : null;
  const activeTag = selectedTag ?? smartTag;

  const filteredLiveThreads = (() => {
    let threads = showBookmarksOnly ? liveThreads.filter(t => bookmarkedSlugs.has(t.slug)) : liveThreads;
    if (activeTag) threads = threads.filter(t => t.tag === activeTag);
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      threads = threads.filter(t =>
        t.title.toLowerCase().includes(q) || t.author_name.toLowerCase().includes(q)
      );
    }
    if (sortMode === 'most_liked') return [...threads].sort((a, b) => b.upvotes - a.upvotes);
    if (sortMode === 'most_comments') return [...threads].sort((a, b) => (b.community_replies?.length ?? 0) - (a.community_replies?.length ?? 0));
    return threads;
  })();

  return (
    <>
      {showAskModal && (
        <AskQuestionModal
          onClose={() => setShowAskModal(false)}
          onPosted={handleQuestionPosted}
        />
      )}

      {/* Posting spinner */}
      {postingQuestion && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-teal-600 animate-spin" />
          <p className="text-base font-semibold text-slate-700">Posting your question…</p>
        </div>
      )}

      {/* Confirmation overlay — shown after email verification or existing session detected */}
      {pendingConfirm && !postingQuestion && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5" style={{ color: '#2D8A7E' }} />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900">Identity verified</h2>
                <p className="text-sm text-slate-500">Ready to post your question to the community</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Your question</p>
              <p className="font-semibold text-slate-800 text-sm leading-snug mb-1">{pendingConfirm.title}</p>
              {pendingConfirm.body && (
                <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap">{pendingConfirm.body}</p>
              )}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                {pendingConfirm.tag && (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${COMMUNITY_TAG_COLORS[pendingConfirm.tag as keyof typeof COMMUNITY_TAG_COLORS] ?? 'bg-slate-100 text-slate-600'}`}>
                    {pendingConfirm.tag}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  Posted as <span className="font-semibold text-slate-600">{pendingConfirm.anonymous ? 'Anonymous' : pendingConfirm.author_name}</span>
                </span>
              </div>
            </div>

            {postError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{postError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setPendingConfirm(null); confirmedUserIdRef.current = null; setPostError(''); }}
                className="flex-1 py-3 rounded-full font-semibold text-slate-600 text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleConfirmPost}
                className="flex-1 py-3 rounded-full font-bold text-white text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#2D8A7E' }}
              >
                Post my question
              </button>
            </div>
          </div>
        </div>
      )}
      {postError && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-2xl flex items-center justify-between gap-4">
            <span>{postError}</span>
            <button onClick={() => setPostError('')} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-2">
            Community Q&amp;A
          </h1>
          <p className="text-slate-500 text-base mb-6">
            Real questions answered by verified, accredited coaches.
          </p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="w-full pl-11 pr-12 py-3 bg-slate-100 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              placeholder="Smart search — try 'burnout' or 'career change'…"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-slate-600'}`}
                title={isListening ? 'Stop listening' : 'Search by voice'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
          </div>

        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-display font-bold text-slate-900 uppercase tracking-wide">
              {showBookmarksOnly ? 'Bookmarks' : 'Questions'}
            </h2>
            {bookmarkedSlugs.size > 0 && (
              <button
                onClick={() => setShowBookmarksOnly(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  showBookmarksOnly
                    ? 'bg-amber-500 text-white border-transparent'
                    : 'border-amber-300 text-amber-600 hover:bg-amber-50'
                }`}
              >
                {showBookmarksOnly
                  ? <><BookmarkX className="h-3.5 w-3.5" /> Show all</>
                  : <><Bookmark className="h-3.5 w-3.5" /> Saved ({bookmarkedSlugs.size})</>
                }
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Category dropdown */}
            <div className="relative" ref={categoryDropdownRef}>
              <button
                onClick={() => setShowCategoryDropdown(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  selectedTag
                    ? `${COMMUNITY_TAG_COLORS[selectedTag]} border-transparent`
                    : 'border-slate-200 text-slate-500 hover:border-slate-400 bg-white'
                }`}
              >
                <Tag className="h-3 w-3" />
                {selectedTag ?? 'Category'}
                <ChevronDown className={`h-3 w-3 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showCategoryDropdown && (
                <div className="absolute right-0 top-full mt-2 z-30 bg-white border border-slate-200 rounded-2xl shadow-lg p-3 w-52">
                  <div className="flex flex-col gap-1">
                    {COMMUNITY_TAGS.map(t => (
                      <button
                        key={t}
                        onClick={() => { setSelectedTag(selectedTag === t ? null : t); setShowCategoryDropdown(false); }}
                        className={`flex items-center justify-between w-full text-left text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                          selectedTag === t
                            ? `${COMMUNITY_TAG_COLORS[t]}`
                            : smartTag === t && !selectedTag
                              ? `${COMMUNITY_TAG_COLORS[t]} opacity-60`
                              : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                        {selectedTag === t && <span className="text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                  {selectedTag && (
                    <button
                      onClick={() => { setSelectedTag(null); setShowCategoryDropdown(false); }}
                      className="mt-2 w-full text-xs text-slate-400 hover:text-slate-600 text-center py-1 border-t border-slate-100"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* Sort pills */}
            <div className="flex items-center bg-slate-100 rounded-full p-0.5 text-xs font-semibold">
              {(['newest', 'most_liked', 'most_comments'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-3 py-1.5 rounded-full transition-all ${sortMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {mode === 'newest' ? 'Newest' : mode === 'most_liked' ? 'Top' : 'Active'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAskModal(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-full transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#2D8A7E' }}
            >
              Ask a Question <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Live threads */}
          {filteredLiveThreads.map(thread => {
            const replyCount = thread.community_replies?.length ?? 0;
            const hasCoach = thread.community_replies?.some(r => r.coach_id !== null) ?? false;
            return (
              <Link
                key={thread.id}
                to={`/community/${thread.slug}`}
                className="block bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-slate-900 text-base leading-snug mb-2 line-clamp-2">
                      {thread.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {thread.tag && COMMUNITY_TAG_COLORS[thread.tag as keyof typeof COMMUNITY_TAG_COLORS] && (
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${COMMUNITY_TAG_COLORS[thread.tag as keyof typeof COMMUNITY_TAG_COLORS]}`}>
                          {thread.tag}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>{thread.author_name}</span>
                      <span>·</span>
                      <span>{new Date(thread.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {hasCoach ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white whitespace-nowrap" style={{ backgroundColor: '#2D8A7E' }}>
                        ⭐ Coach Replied
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 whitespace-nowrap">
                        New
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {bookmarkedSlugs.has(thread.slug) && (
                        <Bookmark className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      )}
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <ChevronUp className="h-3.5 w-3.5" />
                        {thread.upvotes}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Mock seed threads */}
          {filteredMockThreads.map(thread => (
            <Link
              key={thread.id}
              to={`/community/${thread.slug}`}
              className="block bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-slate-900 text-base leading-snug mb-2 line-clamp-2">
                    {thread.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>{thread.author}</span>
                    <span>·</span>
                    <span>{thread.createdAt}</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {hasCoachReply(thread.slug) && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white whitespace-nowrap" style={{ backgroundColor: '#2D8A7E' }}>
                      ⭐ Coach Replied
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <ChevronUp className="h-3.5 w-3.5" />
                    {thread.upvotes}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {filteredMockThreads.length === 0 && filteredLiveThreads.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              {showBookmarksOnly
                ? 'No bookmarks yet — bookmark a thread to save it here.'
                : 'No questions match your search.'
              }
            </div>
          )}
        </div>
      </div>
    </>
  );
};
