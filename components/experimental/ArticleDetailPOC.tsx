// DEV POC — not linked from nav, dev server only
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { LONG_ARTICLES, THREADS } from './mockData';
import { PocNav } from './PocNav';

export const ArticleDetailPOC: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [helpful, setHelpful] = useState<'up' | 'down' | null>(null);

  const article = LONG_ARTICLES.find(a => a.slug === slug);

  if (!article) {
    return (
      <>
        <PocNav />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 mb-4">Article not found.</p>
            <Link to="/insights-poc" className="text-sm font-semibold" style={{ color: '#2D8A7E' }}>
              Back to Community
            </Link>
          </div>
        </div>
      </>
    );
  }

  const relatedThreads = THREADS.filter(t => article.relatedSlugs.includes(t.slug));

  return (
    <>
      <PocNav />
      <div className="min-h-screen bg-slate-50">

        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <Link
              to="/insights-poc"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Community
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main article */}
            <div className="lg:col-span-2 space-y-6">

              {/* Tag + meta */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: '#2D8A7E' }}
                >
                  {article.tag}
                </span>
                <span className="text-xs text-slate-400">{article.readTime}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-400">{article.publishedAt}</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 leading-snug">
                {article.title}
              </h1>

              {/* Author card */}
              <div
                className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl border"
                style={{ borderLeft: '4px solid #2D8A7E', borderTopColor: '#e2e8f0', borderRightColor: '#e2e8f0', borderBottomColor: '#e2e8f0' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: '#2D8A7E' }}
                  >
                    {article.author.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{article.author.name}</p>
                    <p className="text-xs text-slate-500">{article.author.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="h-3 w-3 text-trust-500" />
                      <span className="text-xs text-trust-600 font-medium">{article.author.accreditation}</span>
                    </div>
                  </div>
                </div>
                <Link
                  to={`/coach/${article.author.coachId}`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:opacity-90"
                  style={{ color: '#2D8A7E', borderColor: '#2D8A7E' }}
                >
                  View Profile →
                </Link>
              </div>

              {/* Body */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
                {article.body.map((para, i) => (
                  <p key={i} className="text-slate-700 leading-relaxed text-base">
                    {para}
                  </p>
                ))}
              </div>

              {/* Was this helpful? */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between flex-wrap gap-4">
                <p className="text-sm font-semibold text-slate-700">Was this article helpful?</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHelpful(helpful === 'up' ? null : 'up')}
                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-all ${
                      helpful === 'up'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Yes
                  </button>
                  <button
                    onClick={() => setHelpful(helpful === 'down' ? null : 'down')}
                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-all ${
                      helpful === 'down'
                        ? 'border-red-300 bg-red-50 text-red-600'
                        : 'border-slate-200 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Not really
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar — related threads */}
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5" />
                Related Discussions
              </p>
              {relatedThreads.map(thread => (
                <Link
                  key={thread.id}
                  to={`/insights-poc/${thread.slug}`}
                  className="block bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-brand-200 transition-all"
                >
                  <p className="text-sm font-bold text-slate-900 leading-snug mb-2 line-clamp-3">
                    {thread.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{thread.replies.length} replies</span>
                    {thread.replies.some(r => r.isCoach) && (
                      <span
                        className="px-2 py-0.5 rounded-full text-white font-semibold"
                        style={{ backgroundColor: '#2D8A7E' }}
                      >
                        ⭐ Coach
                      </span>
                    )}
                  </div>
                </Link>
              ))}

              {/* CTA */}
              <div
                className="rounded-2xl p-5 text-white text-center"
                style={{ backgroundColor: '#2D8A7E' }}
              >
                <p className="text-sm font-bold mb-1">Want personalised advice?</p>
                <p className="text-xs opacity-80 mb-3">Connect with a verified coach who specialises in this area.</p>
                <Link
                  to="/search"
                  className="inline-block bg-white text-sm font-semibold px-4 py-2 rounded-full transition-opacity hover:opacity-90"
                  style={{ color: '#2D8A7E' }}
                >
                  Find a Coach →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
