import React, { useRef } from 'react';
import { Star } from 'lucide-react';
import { ProductReview } from '../types';

interface ProductReviewCardProps {
  review: ProductReview;
}

export const ProductReviewCard: React.FC<ProductReviewCardProps> = ({ review }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateY(-6px)`;
    card.style.boxShadow = `${x * -12}px ${y * -12}px 32px rgba(99,102,241,0.12), 0 20px 40px rgba(0,0,0,0.08)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
    card.style.boxShadow = '';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 cursor-default select-none h-full"
      style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
    >
      {/* Avatar + Stars */}
      <div className="flex items-center gap-3">
        {review.reviewerPhotoUrl ? (
          <img
            src={review.reviewerPhotoUrl}
            alt={review.reviewerName}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-slate-100"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 border border-slate-100">
            <span className="text-indigo-600 font-semibold text-sm select-none">
              {review.reviewerName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              className={`transition-transform duration-300 group-hover:scale-110 ${
                star <= review.rating
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-200 fill-slate-200'
              }`}
              style={{ transitionDelay: `${star * 30}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Review text */}
      <p className="text-slate-700 text-sm leading-relaxed flex-1 relative z-10">
        "{review.text}"
      </p>

      {/* Reviewer info + source badge */}
      <div className="flex items-end justify-between gap-2 pt-2 border-t border-slate-100">
        <div>
          <p className="text-sm font-semibold text-slate-900">{review.reviewerName}</p>
          {review.reviewerTitle && (
            <p className="text-xs text-slate-500 mt-0.5">{review.reviewerTitle}</p>
          )}
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {review.source === 'facebook' ? 'via Facebook' : 'Reviewed on CoachDog'}
        </span>
      </div>
    </div>
  );
};
