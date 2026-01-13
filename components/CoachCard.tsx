import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coach, CURRENCIES } from '../types';
import { BadgeCheck, Star, MapPin, ArrowRight, Sparkles } from 'lucide-react';

interface CoachCardProps {
  coach: Coach;
  matchReason?: string;
  matchPercentage?: number;
  filterMatchPercentage?: number;
}

export const CoachCard: React.FC<CoachCardProps> = ({ coach, matchReason, matchPercentage, filterMatchPercentage }) => {
  const navigate = useNavigate();
  const avgRating = coach.reviews?.length 
    ? (coach.reviews.reduce((acc, r) => acc + r.rating, 0) / coach.reviews.length).toFixed(1)
    : 'New';

  const handleClick = () => {
    navigate(`/coach/${coach.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-300 transition-all duration-300 cursor-pointer overflow-hidden p-5 flex flex-col sm:flex-row gap-5 items-start"
    >
      {/* Hover Ring Effect */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-brand-500/50 rounded-2xl pointer-events-none transition-all duration-300"></div>

      {/* Image with subtle zoom */}
      <div className="relative w-28 h-28 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden shadow-sm">
        <img 
          src={coach.photoUrl} 
          alt={coach.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {coach.isVerified && (
          <div className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] font-bold text-slate-800 flex items-center shadow-sm border border-slate-100">
            <BadgeCheck className="h-3 w-3 text-trust-500 mr-1" />
            Verified
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-grow min-w-0 w-full relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-brand-700 transition-colors truncate">{coach.name}</h3>
            <p className="text-brand-600 font-bold text-xs uppercase tracking-wide mb-2">{coach.specialties?.[0] || 'General'}</p>
          </div>
          <div className="text-right">
              <span className="text-xl font-bold text-slate-900">
                {CURRENCIES.find(c => c.code === (coach.currency || 'GBP'))?.symbol || '£'}{coach.hourlyRate}
              </span>
              <span className="text-xs text-slate-400 block font-medium">/hr</span>
          </div>
        </div>

        <div className="flex items-center text-slate-500 text-xs mb-3 font-medium">
           <MapPin className="h-3.5 w-3.5 mr-1" /> {coach.location}
           <span className="mx-2 text-slate-300">|</span>
           <Star className="h-3.5 w-3.5 text-yellow-400 fill-current mr-1" />
           <span className="text-slate-700">{avgRating}</span>
           <span className="text-slate-400 ml-1">({coach.reviews?.length || 0})</span>
        </div>
        
        <p className="text-slate-600 text-sm line-clamp-2 mb-4 leading-relaxed">{coach.bio}</p>

        <div className="flex justify-between items-end">
            {matchReason ? (
            <div className="flex items-center gap-2">
              {matchPercentage !== undefined && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 flex items-center shadow-sm">
                  <span className="text-xs font-bold text-green-800">{matchPercentage}% Match</span>
                </div>
              )}
              <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 rounded-lg px-3 py-1.5 flex items-center shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-brand-600 mr-2" />
                  <span className="text-xs font-bold text-brand-800 line-clamp-1">{matchReason}</span>
              </div>
            </div>
            ) : filterMatchPercentage !== undefined ? (
            <div className="flex items-center gap-2">
              <div className={`rounded-lg px-3 py-1.5 flex items-center shadow-sm border ${
                filterMatchPercentage === 100
                  ? 'bg-green-50 border-green-200'
                  : filterMatchPercentage >= 75
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <span className={`text-xs font-bold ${
                  filterMatchPercentage === 100
                    ? 'text-green-800'
                    : filterMatchPercentage >= 75
                    ? 'text-amber-800'
                    : 'text-orange-800'
                }`}>
                  {filterMatchPercentage}% Match
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {coach.certifications?.slice(0, 1).map((cert, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
            ) : (
            <div className="flex flex-wrap gap-2">
                {coach.certifications?.slice(0, 2).map((cert, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {cert}
                    </span>
                ))}
            </div>
            )}

            {/* View Profile Button that appears/colors on hover */}
            <div className="hidden sm:flex items-center text-sm font-bold text-slate-300 group-hover:text-brand-600 transition-colors">
                View Profile <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
      </div>
    </div>
  );
};