import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coach } from '../types';
import { BadgeCheck, Star, MapPin, Clock, Award, ArrowRight } from 'lucide-react';

interface CoachCardProps {
  coach: Coach;
  matchReason?: string;
}

export const CoachCard: React.FC<CoachCardProps> = ({ coach, matchReason }) => {
  const navigate = useNavigate();
  const avgRating = coach.reviews.length 
    ? (coach.reviews.reduce((acc, r) => acc + r.rating, 0) / coach.reviews.length).toFixed(1)
    : 'New';

  const handleClick = () => {
    navigate(`/coach/${coach.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-200 transition-all cursor-pointer overflow-hidden flex flex-col sm:flex-row p-4 gap-4 items-start"
    >
      {/* Square Standardized Image */}
      <div className="relative w-32 h-32 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
        <img 
          src={coach.photoUrl} 
          alt={coach.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {coach.isVerified && (
          <div className="absolute top-1 left-1 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700 flex items-center shadow-sm">
            <BadgeCheck className="h-3 w-3 text-trust-500 mr-0.5" />
            Verified
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-grow min-w-0 w-full">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">{coach.name}</h3>
            <p className="text-brand-600 font-medium text-xs uppercase tracking-wide mb-1">{coach.specialties[0]}</p>
          </div>
          <div className="text-right">
              <span className="text-lg font-bold text-slate-900">${coach.hourlyRate}</span>
              <span className="text-xs text-slate-500 block">/hr</span>
          </div>
        </div>

        <div className="flex items-center text-slate-500 text-xs mb-2">
           <MapPin className="h-3 w-3 mr-1" /> {coach.location}
           <span className="mx-2 text-slate-300">|</span>
           <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
           <span className="font-medium text-slate-700">{avgRating}</span>
           <span className="text-slate-400 ml-0.5">({coach.reviews.length})</span>
        </div>
        
        <p className="text-slate-600 text-sm line-clamp-2 mb-3">{coach.bio}</p>

        {matchReason ? (
          <div className="bg-brand-50 border border-brand-100 rounded px-2 py-1.5 flex items-center">
             <Star className="h-3 w-3 text-brand-600 mr-1.5" />
             <span className="text-xs font-medium text-brand-800 line-clamp-1">{matchReason}</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
             {coach.certifications.slice(0, 2).map((cert, idx) => (
                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                   {cert}
                </span>
             ))}
          </div>
        )}
      </div>
      
      {/* Mobile-only arrow to indicate clickability */}
      <div className="hidden sm:flex self-center">
        <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-brand-500 transition-colors" />
      </div>
    </div>
  );
};