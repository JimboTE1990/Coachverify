import React, { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { addProductReview } from '../services/supabaseService';

/**
 * Renders a small star pill button in the nav bar for authenticated coaches
 * who haven't yet submitted a product review. Clicking opens a modal form.
 * Disappears permanently after submission; dismisses for the session on X.
 */
export const ReviewPromptBanner: React.FC = () => {
  const { isAuthenticated, coach } = useAuth();

  const [hidden, setHidden] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ reviewerName: '', reviewerTitle: '', rating: 5, text: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!coach?.id) return;
    if (localStorage.getItem(`product_reviewed_${coach.id}`) === 'true') setHidden(true);
  }, [coach?.id]);

  useEffect(() => {
    if (showModal && coach?.name) {
      setForm((f) => ({ ...f, reviewerName: f.reviewerName || coach.name }));
    }
  }, [showModal, coach?.name]);

  if (!isAuthenticated || !coach || hidden) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.reviewerName.trim()) { setFormError('Please enter your name.'); return; }
    if (form.text.trim().length < 20) { setFormError('Please write at least 20 characters.'); return; }

    setSubmitting(true);
    const result = await addProductReview({
      reviewerName: form.reviewerName.trim(),
      reviewerTitle: form.reviewerTitle.trim() || undefined,
      rating: form.rating,
      text: form.text.trim(),
    });
    setSubmitting(false);

    if (!result) { setFormError('Something went wrong — please try again.'); return; }

    setSubmitted(true);
    localStorage.setItem(`product_reviewed_${coach.id}`, 'true');
  };

  const handleClose = () => {
    if (submitted) setHidden(true);
    setShowModal(false);
    setSubmitted(false);
    setFormError('');
    setForm({ reviewerName: coach?.name || '', reviewerTitle: '', rating: 5, text: '' });
  };

  return (
    <>
      {/* Nav pill button */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-amber-600 border border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 transition-all"
        >
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          Rate us
        </button>
        <button
          onClick={() => setHidden(true)}
          className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {submitted ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Thanks for your review!</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Your review is now live. Thank you for helping other coaches find CoachDog.
                </p>
                <button
                  onClick={handleClose}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-slate-900">Review CoachDog</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm({ ...form, rating: star })}
                        className="focus:outline-none transition-transform hover:scale-125"
                        aria-label={`${star} stars`}
                      >
                        <Star
                          size={28}
                          className={star <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your name</label>
                  <input
                    type="text"
                    value={form.reviewerName}
                    onChange={(e) => setForm({ ...form, reviewerName: e.target.value })}
                    placeholder="Jane Smith"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Your coaching title <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.reviewerTitle}
                    onChange={(e) => setForm({ ...form, reviewerTitle: e.target.value })}
                    placeholder="e.g. Executive Coach, ICF ACC"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your review</label>
                  <textarea
                    value={form.text}
                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                    rows={4}
                    placeholder="Share your experience with CoachDog..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>

                {formError && <p className="text-red-600 text-sm">{formError}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                >
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  Your review will be visible once approved by our team, usually within 24 hours.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
