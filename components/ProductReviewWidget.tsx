import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Star, X } from 'lucide-react';
import { ProductReview } from '../types';
import { getProductReviews, addProductReview } from '../services/supabaseService';
import { ProductReviewCard } from './ProductReviewCard';
import { useAuth } from '../hooks/useAuth';

export const ProductReviewWidget: React.FC = () => {
  const { coach } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    reviewerName: coach?.name || '',
    reviewerTitle: '',
    rating: 5,
    text: '',
  });
  const [formError, setFormError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProductReviews().then((data) => {
      setReviews(data);
      setLoading(false);
    });
  }, []);

  // Update arrow states on scroll
  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    return () => el.removeEventListener('scroll', updateArrows);
  }, [reviews]);

  const scroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth / 3;
    el.scrollBy({ left: direction === 'next' ? cardWidth : -cardWidth, behavior: 'smooth' });
  };

  // Pre-fill name from coach profile when modal opens
  useEffect(() => {
    if (showModal && coach?.name) {
      setForm((f) => ({ ...f, reviewerName: f.reviewerName || coach.name }));
    }
  }, [showModal, coach]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.reviewerName.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    if (!form.text.trim() || form.text.trim().length < 20) {
      setFormError('Please write at least 20 characters.');
      return;
    }

    setSubmitting(true);
    const result = await addProductReview({
      reviewerName: form.reviewerName.trim(),
      reviewerTitle: form.reviewerTitle.trim() || undefined,
      rating: form.rating,
      text: form.text.trim(),
    });
    setSubmitting(false);

    if (!result) {
      setFormError('Something went wrong — please try again.');
      return;
    }

    setSubmitted(true);
    setReviews((prev) => [result, ...prev]);
  };

  const handleClose = () => {
    setShowModal(false);
    setSubmitted(false);
    setFormError('');
    setForm({ reviewerName: coach?.name || '', reviewerTitle: '', rating: 5, text: '' });
  };

  if (loading) return null;

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header row */}
        <div className="relative mb-10 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            What coaches say about CoachDog
          </h2>
          <p className="text-slate-500 text-base">
            Real feedback from coaches building their practice with us.
          </p>

          {/* Arrow controls */}
          {reviews.length > 3 && (
            <div className="absolute right-0 top-0 flex gap-2">
              <button
                onClick={() => scroll('prev')}
                disabled={!canPrev}
                aria-label="Previous reviews"
                className="h-10 w-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 transition-all duration-200 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:hover:shadow-none"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll('next')}
                disabled={!canNext}
                aria-label="Next reviews"
                className="h-10 w-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 transition-all duration-200 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:hover:shadow-none"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="text-center text-slate-400 py-8">
            No reviews yet — be the first to share your experience.
          </p>
        ) : (
          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="snap-start flex-shrink-0 px-3"
                style={{ width: '33.333%' }}
              >
                <ProductReviewCard review={review} />
              </div>
            ))}
          </div>
        )}

        {/* Leave a Review CTA */}
        {!!coach && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              <Star size={15} className="fill-white" />
              Leave a Review
            </button>
          </div>
        )}
      </div>

      {/* Submit modal */}
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

                {/* Star rating */}
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
                          className={`transition-colors duration-150 ${
                            star <= form.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 fill-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
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

                {/* Title (optional) */}
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

                {/* Review text */}
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

                {formError && (
                  <p className="text-red-600 text-sm">{formError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                >
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  Reviews appear publicly immediately. We may remove reviews that violate our guidelines.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
