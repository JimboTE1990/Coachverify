import React, { useState, useEffect } from 'react';
import { getCoaches, toggleFlagReview, getProductReviews, getPendingProductReviews, adminActionProductReview } from '../services/supabaseService';
import { Coach, ProductReview } from '../types';
import { Lock, FileText, Flag, Star, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

const COACHES_PER_PAGE = 10;
const REVIEWS_PER_PAGE = 6;

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [coachPage, setCoachPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'reviews' | 'coaches'>('reviews');
  const [pendingProductReviews, setPendingProductReviews] = useState<ProductReview[]>([]);
  const [approvedProductReviews, setApprovedProductReviews] = useState<ProductReview[]>([]);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [pendingConfirm, setPendingConfirm] = useState<{
    action: 'approve' | 'delete';
    reviewId: string;
    reviewerName: string;
  } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        const [coachData, approvedData, pendingData] = await Promise.all([
          getCoaches(),
          getProductReviews(),
          getPendingProductReviews(),
        ]);
        setCoaches(coachData);
        setApprovedProductReviews(approvedData);
        setPendingProductReviews(pendingData);
      };
      loadData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = (import.meta as any).env?.VITE_ADMIN_PASSWORD;
    if (adminPassword && password === adminPassword) {
      setIsAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  const handleProductReviewAction = async (action: 'approve' | 'delete', reviewId: string) => {
    const adminPassword = (import.meta as any).env?.VITE_ADMIN_PASSWORD;
    const success = await adminActionProductReview(action, reviewId, adminPassword);
    if (!success) { alert('Action failed — please try again.'); return; }

    if (action === 'approve') {
      const review = pendingProductReviews.find(r => r.id === reviewId);
      if (review) {
        setPendingProductReviews(prev => prev.filter(r => r.id !== reviewId));
        setApprovedProductReviews(prev => [review, ...prev]);
      }
    } else {
      setPendingProductReviews(prev => prev.filter(r => r.id !== reviewId));
      setApprovedProductReviews(prev => prev.filter(r => r.id !== reviewId));
    }
  };

  const handleFlag = async (coachId: string, reviewId: string) => {
    await toggleFlagReview(coachId, reviewId);
    const updated = await getCoaches();
    setCoaches(updated);
  };

  // Derived — coaches
  const filteredCoaches = coaches.filter(c => {
    if (!filterStatus) return true;
    if (filterStatus === 'other') return !['lifetime', 'active', 'trial'].includes(c.subscriptionStatus);
    return c.subscriptionStatus === filterStatus;
  });
  const totalCoachPages = Math.max(1, Math.ceil(filteredCoaches.length / COACHES_PER_PAGE));
  const pagedCoaches = filteredCoaches.slice((coachPage - 1) * COACHES_PER_PAGE, coachPage * COACHES_PER_PAGE);

  // Derived — approved reviews
  const filteredApproved = starFilter ? approvedProductReviews.filter(r => r.rating === starFilter) : approvedProductReviews;
  const totalReviewPages = Math.max(1, Math.ceil(filteredApproved.length / REVIEWS_PER_PAGE));
  const pagedApproved = filteredApproved.slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE);

  const SubBadge = ({ coach }: { coach: Coach }) => {
    if (coach.subscriptionStatus === 'lifetime') return <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">Lifetime</span>;
    if (coach.subscriptionStatus === 'active') return <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold capitalize">{coach.billingCycle}</span>;
    if (coach.subscriptionStatus === 'trial') return (
      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">
        Trial{coach.trialEndsAt ? ` · ends ${new Date(coach.trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
      </span>
    );
    if (coach.subscriptionStatus === 'expired') return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 font-semibold">Expired</span>;
    return <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-semibold">Onboarding</span>;
  };

  const Paginator = ({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) => (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
      <p className="text-xs text-slate-400">Page {page} of {total}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === total}
          className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="bg-slate-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Admin Access</h2>
            <p className="text-slate-500">Please verify your credentials.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors">
              Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-600 hover:underline">Logout</button>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'reviews'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          <MessageSquare size={15} />
          Reviews
          {pendingProductReviews.length > 0 && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
              {pendingProductReviews.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('coaches')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'coaches'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          <FileText size={15} />
          Coaches
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'coaches' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {coaches.length}
          </span>
        </button>
      </div>

      {/* ── REVIEWS TAB ── */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

          {/* Pending queue */}
          <div className="mb-10">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4 flex items-center gap-2">
              Pending approval
              {pendingProductReviews.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingProductReviews.length}
                </span>
              )}
            </h3>

            {pendingProductReviews.length === 0 ? (
              <p className="text-slate-400 text-sm py-2">Queue clear — nothing to review.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingProductReviews.map((review) => (
                  <div key={review.id} className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex flex-col gap-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={14} className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                      ))}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed flex-1">"{review.text}"</p>
                    <div className="border-t border-amber-100 pt-2">
                      <p className="text-sm font-semibold text-slate-900">{review.reviewerName}</p>
                      {!!review.reviewerTitle && <p className="text-xs text-slate-500">{review.reviewerTitle}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">{review.date}</p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setPendingConfirm({ action: 'approve', reviewId: review.id, reviewerName: review.reviewerName })}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm py-2 rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setPendingConfirm({ action: 'delete', reviewId: review.id, reviewerName: review.reviewerName })}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm py-2 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live reviews */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Live reviews
                <span className="ml-2 text-slate-400 font-normal normal-case">({filteredApproved.length})</span>
              </h3>
              {/* Star filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 mr-1">Filter:</span>
                <button
                  onClick={() => { setStarFilter(null); setReviewPage(1); }}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${!starFilter ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  All
                </button>
                {[5, 4, 3, 2, 1].map(s => (
                  <button
                    key={s}
                    onClick={() => { setStarFilter(starFilter === s ? null : s); setReviewPage(1); }}
                    className={`flex items-center gap-0.5 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${starFilter === s ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {s}<Star size={10} className="fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {filteredApproved.length === 0 ? (
              <p className="text-slate-400 text-sm">No approved reviews{starFilter ? ` with ${starFilter} stars` : ''} yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pagedApproved.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={14} className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                        ))}
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed flex-1">"{review.text}"</p>
                      <div className="border-t border-slate-100 pt-2">
                        <p className="text-sm font-semibold text-slate-900">{review.reviewerName}</p>
                        {!!review.reviewerTitle && <p className="text-xs text-slate-500">{review.reviewerTitle}</p>}
                        <p className="text-xs text-slate-400 mt-0.5">{review.date}</p>
                      </div>
                      <button
                        onClick={() => setPendingConfirm({ action: 'delete', reviewId: review.id, reviewerName: review.reviewerName })}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm py-2 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
                {totalReviewPages > 1 && (
                  <Paginator page={reviewPage} total={totalReviewPages} onChange={(p) => setReviewPage(p)} />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── COACHES TAB ── */}
      {activeTab === 'coaches' && (
        <>
          {/* Subscription summary tiles */}
          {coaches.length > 0 && (() => {
            const lifetime = coaches.filter(c => c.subscriptionStatus === 'lifetime').length;
            const active = coaches.filter(c => c.subscriptionStatus === 'active').length;
            const trial = coaches.filter(c => c.subscriptionStatus === 'trial').length;
            const other = coaches.filter(c => !['lifetime', 'active', 'trial'].includes(c.subscriptionStatus)).length;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {([
                  { key: 'lifetime', count: lifetime, label: 'Lifetime', color: 'purple' },
                  { key: 'active', count: active, label: 'Active (Monthly / Annual)', color: 'blue' },
                  { key: 'trial', count: trial, label: 'Free Trial', color: 'amber' },
                  { key: 'other', count: other, label: 'Expired / Onboarding', color: 'slate' },
                ] as { key: string; count: number; label: string; color: string }[]).map(({ key, count, label, color }) => (
                  <button
                    key={key}
                    onClick={() => { setFilterStatus(filterStatus === key ? null : key); setCoachPage(1); }}
                    className={`rounded-xl p-4 text-center border transition-all hover:shadow-md
                      ${color === 'purple' ? 'bg-purple-50 border-purple-100' : ''}
                      ${color === 'blue' ? 'bg-blue-50 border-blue-100' : ''}
                      ${color === 'amber' ? 'bg-amber-50 border-amber-100' : ''}
                      ${color === 'slate' ? 'bg-slate-50 border-slate-200' : ''}
                      ${filterStatus === key ? `ring-2 ring-offset-1 ${color === 'purple' ? 'ring-purple-400' : color === 'blue' ? 'ring-blue-400' : color === 'amber' ? 'ring-amber-400' : 'ring-slate-400'}` : ''}
                    `}
                  >
                    <p className={`text-2xl font-bold ${color === 'purple' ? 'text-purple-700' : color === 'blue' ? 'text-blue-700' : color === 'amber' ? 'text-amber-700' : 'text-slate-500'}`}>{count}</p>
                    <p className={`text-xs font-semibold mt-1 ${color === 'purple' ? 'text-purple-500' : color === 'blue' ? 'text-blue-500' : color === 'amber' ? 'text-amber-500' : 'text-slate-400'}`}>{label}</p>
                    {filterStatus === key && <p className={`text-xs mt-0.5 ${color === 'purple' ? 'text-purple-400' : color === 'blue' ? 'text-blue-400' : color === 'amber' ? 'text-amber-400' : 'text-slate-400'}`}>Filtering ✕</p>}
                  </button>
                ))}
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coach list */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" /> Coaches
                    <span className="text-slate-400 font-normal">({filteredCoaches.length})</span>
                  </h2>
                  {filterStatus && (
                    <button onClick={() => setFilterStatus(null)} className="text-xs text-indigo-600 hover:underline">Clear filter</button>
                  )}
                </div>
                {pagedCoaches.map(coach => (
                  <div key={coach.id} className="px-4 py-3 border-b border-slate-100 last:border-0 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <img src={coach.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{coach.name}</p>
                        <p className="text-xs text-slate-400">{coach.specialties.slice(0, 2).join(', ')}</p>
                      </div>
                    </div>
                    <SubBadge coach={coach} />
                  </div>
                ))}
                {totalCoachPages > 1 && (
                  <div className="px-4 pb-3">
                    <Paginator page={coachPage} total={totalCoachPages} onChange={(p) => setCoachPage(p)} />
                  </div>
                )}
              </div>
            </div>

            {/* Review Flags */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Flag className="h-4 w-4 text-yellow-500" /> Review Flags
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {coaches.flatMap(c => c.reviews.map(r => ({...r, coachName: c.name, coachId: c.id}))).filter(r => r.isFlagged).length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-4">No flagged reviews.</p>
                  )}
                  {coaches.flatMap(c => c.reviews.map(r => ({...r, coachName: c.name, coachId: c.id})))
                    .filter(r => r.isFlagged)
                    .map(review => (
                      <div key={review.id} className="bg-red-50 p-3 rounded-lg border border-red-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-red-800">Flagged: Fake/Abusive</span>
                          <button onClick={() => handleFlag(review.coachId, review.id)} className="text-xs text-slate-500 hover:text-slate-800 underline">Dismiss</button>
                        </div>
                        <p className="text-sm text-slate-800 italic">"{review.text}"</p>
                        <p className="text-xs text-slate-500 mt-2">— for {review.coachName}</p>
                      </div>
                    ))
                  }
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* Confirm modal */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {pendingConfirm.action === 'delete' ? 'Delete review?' : 'Approve review?'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {pendingConfirm.action === 'delete'
                ? <>This will permanently delete <span className="font-semibold text-slate-700">{pendingConfirm.reviewerName}</span>'s review. This cannot be undone.</>
                : <>This will make <span className="font-semibold text-slate-700">{pendingConfirm.reviewerName}</span>'s review publicly visible.</>
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingConfirm(null)}
                className="flex-1 border border-slate-200 text-slate-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleProductReviewAction(pendingConfirm.action, pendingConfirm.reviewId);
                  setPendingConfirm(null);
                }}
                className={`flex-1 font-semibold text-sm py-2.5 rounded-xl transition-colors ${
                  pendingConfirm.action === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {pendingConfirm.action === 'delete' ? 'Yes, delete' : 'Yes, approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
