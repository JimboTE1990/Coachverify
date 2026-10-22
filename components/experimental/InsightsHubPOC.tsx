// DEV POC — not linked from nav, dev server only
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, ChevronUp, ArrowRight } from 'lucide-react';
import { INSIGHT_CHIPS, THREADS, ARTICLES } from './mockData';
import { PocNav } from './PocNav';
import { AskQuestionModal } from './AskQuestionModal';
import { supabase } from '../../lib/supabase';

interface LiveThread {
  id: string;
  slug: string;
  title: string;
  author_name: string;
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

export const InsightsHubPOC: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [showAskModal, setShowAskModal] = useState(false);
  const [liveThreads, setLiveThreads] = useState<LiveThread[]>([]);

  const fetchLiveThreads = async () => {
    const { data: threads } = await supabase
      .from('community_threads')
      .select('id, slug, title, author_name, upvotes, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!threads) return;

    // Separate query for replies — avoids PostgREST FK resolution issues on text columns
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

    setLiveThreads(threads.map(t => ({
      ...t,
      community_replies: replyMap.get(t.slug) ?? [],
    })));
  };

  useEffect(() => {
    fetchLiveThreads();

    // Handle magic-link return: post any pending question saved before redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const raw = localStorage.getItem('cd_pending_question');
        if (!raw) return;
        try {
          const pending = JSON.parse(raw) as {
            title: string; body: string | null;
            author_name: string; author_email: string; anonymous: boolean;
          };
          localStorage.removeItem('cd_pending_question');

          // Upsert community profile
          const displayName = pending.anonymous ? 'Anonymous' : pending.author_name;
          await supabase.from('community_users').upsert(
            { user_id: session.user.id, display_name: displayName, marketing_opt_in: false },
            { onConflict: 'user_id' }
          );

          const slug = slugify(pending.title);
          const { error } = await supabase.from('community_threads').insert({
            slug,
            title: pending.title,
            body: pending.body,
            author_name: displayName,
            author_email: pending.author_email,
            user_id: session.user.id,
            tag: 'Community',
          });
          if (!error) navigate(`/insights-poc/${slug}`);
        } catch {}
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasCoachReply = (slug: string) => {
    const thread = THREADS.find(t => t.slug === slug);
    return thread?.replies.some(r => r.isCoach) ?? false;
  };

  const handleQuestionPosted = (slug: string) => {
    setShowAskModal(false);
    navigate(`/insights-poc/${slug}`);
  };

  const filteredMockThreads = searchValue.trim()
    ? THREADS.filter(
        t =>
          t.title.toLowerCase().includes(searchValue.toLowerCase()) ||
          t.author.toLowerCase().includes(searchValue.toLowerCase())
      )
    : THREADS;

  const filteredLiveThreads = searchValue.trim()
    ? liveThreads.filter(
        t =>
          t.title.toLowerCase().includes(searchValue.toLowerCase()) ||
          t.author_name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : liveThreads;

  return (
    <>
      <PocNav />
      {showAskModal && (
        <AskQuestionModal
          onClose={() => setShowAskModal(false)}
          onPosted={handleQuestionPosted}
        />
      )}
      <div className="min-h-screen bg-slate-50">

        {/* Page Header */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🐾</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">CoachDog</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-2">
              Community
            </h1>
            <p className="text-slate-500 text-base mb-6">
              Real questions. Verified answers. Insights from accredited coaches.
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-11 pr-4 py-3 bg-slate-100 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                placeholder="Search articles, community Q&As, and coach insights..."
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-12">

          {/* Daily Insights Carousel */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              My Daily Insights
            </p>
            <div
              className="flex gap-3 overflow-x-auto pb-3"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {INSIGHT_CHIPS.map(chip => (
                <Link
                  key={chip.id}
                  to={`/insights-poc/${chip.slug}`}
                  className={`${chip.bg} flex-shrink-0 rounded-2xl p-4 text-white flex flex-col justify-between transition-transform hover:-translate-y-1`}
                  style={{ width: 170, minHeight: 210 }}
                >
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide opacity-70 block mb-3">
                      {chip.tag}
                    </span>
                    <p className="text-sm font-bold leading-snug">
                      {chip.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-4">
                    <span className="text-base">{chip.metaIcon}</span>
                    <span className="text-xs opacity-60">{chip.meta}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Community Q&A */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-display font-bold text-slate-900 uppercase tracking-wide">
                Community Q&amp;A
              </h2>
              <button
                onClick={() => setShowAskModal(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-full transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#2D8A7E' }}
              >
                Ask a Question <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Live threads from DB — shown first (newest) */}
              {filteredLiveThreads.map(thread => {
                const replyCount = thread.community_replies?.length ?? 0;
                const hasCoachReply = thread.community_replies?.some(r => r.coach_id !== null) ?? false;
                return (
                  <Link
                    key={thread.id}
                    to={`/insights-poc/${thread.slug}`}
                    className="block bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-slate-900 text-base leading-snug mb-2 line-clamp-2">
                          {thread.title}
                        </h3>
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
                        {hasCoachReply ? (
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full text-white whitespace-nowrap"
                            style={{ backgroundColor: '#2D8A7E' }}
                          >
                            ⭐ Coach Replied
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 whitespace-nowrap">
                            New
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <ChevronUp className="h-3.5 w-3.5" />
                          {thread.upvotes}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* Mock seed threads */}
              {filteredMockThreads.map(thread => (
                <Link
                  key={thread.id}
                  to={`/insights-poc/${thread.slug}`}
                  className="block bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all"
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
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full text-white whitespace-nowrap"
                          style={{ backgroundColor: '#2D8A7E' }}
                        >
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
                  No questions match your search.
                </div>
              )}
            </div>
          </section>

          {/* Insights & Guides */}
          <section>
            <h2 className="text-lg font-display font-bold text-slate-900 uppercase tracking-wide mb-5">
              Insights &amp; Guides
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ARTICLES.map(article => (
                <Link
                  key={article.id}
                  to={article.href}
                  className={`${article.bg} rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-48`}
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-3">
                      {article.tag}
                    </span>
                    <p className="font-display font-bold text-slate-900 text-sm leading-snug mb-3">
                      {article.title}
                    </p>
                    {article.badge && (
                      <span className="text-xs text-slate-500 font-medium">
                        {article.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold mt-4 block" style={{ color: '#2D8A7E' }}>
                    {article.cta}
                  </span>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
};
