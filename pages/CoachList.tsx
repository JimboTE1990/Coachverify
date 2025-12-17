import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { getCoaches, searchCoaches } from '../services/supabaseService';
import { Coach, QuestionnaireAnswers } from '../types';
import { CoachCard } from '../components/CoachCard';
import { calculateMatchScore, getMatchReason as getEnhancedMatchReason, sortCoachesByMatch } from '../utils/matchCalculator';

export const CoachList: React.FC = () => {
  const location = useLocation();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true); // NEW: Track loading state
  const [searchTerm, setSearchTerm] = useState('');

  // State for filters
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(300);

  // Questionnaire results passed from Onboarding
  const [matchData, setMatchData] = useState<QuestionnaireAnswers | null>(null);

  useEffect(() => {
    // Load initial data from Supabase
    const loadCoaches = async () => {
      setIsLoading(true);
      const data = await getCoaches();
      setCoaches(data);
      setIsLoading(false); // Set to false after data loads
    };
    loadCoaches();

    // Check for navigation state (Questionnaire results)
    if (location.state && (location.state as any).questionnaireResults) {
      const q = (location.state as any).questionnaireResults as QuestionnaireAnswers;
      setMatchData(q);
      // Pre-set filters based on matches
      if (q.goal) setSpecialtyFilter(q.goal);
      if (q.budgetRange) setMaxPrice(q.budgetRange);
    }
  }, [location]);

  const clearMatch = () => {
    setMatchData(null);
    setSpecialtyFilter('');
    setMaxPrice(300);
  };

  const filteredCoaches = useMemo(() => {
    if (!coaches) return [];

    let result = coaches.filter(coach => {
      if (!coach) return false;

      // Note: Expired subscriptions are now filtered at the database level via profile_visible field
      // No need to filter client-side anymore

      // 1. Text Search (Defensive check for name/location existence)
      // Use optional chaining for safety
      const name = coach.name ? coach.name.toLowerCase() : '';
      const loc = coach.location ? coach.location.toLowerCase() : '';
      const search = searchTerm.toLowerCase();
      
      const textMatch = name.includes(search) || loc.includes(search);
      
      // 2. Specialty Filter
      const specMatch = specialtyFilter 
        ? (coach.specialties && coach.specialties.includes(specialtyFilter as any)) 
        : true;
      
      // 3. Price Filter
      const priceMatch = (coach.hourlyRate || 0) <= maxPrice;

      return textMatch && specMatch && priceMatch;
    });

    // 4. Sort by Match Relevance if matchData exists - using enhanced calculator
    if (matchData) {
      result = sortCoachesByMatch(result, matchData);
    }

    return result;
  }, [coaches, searchTerm, specialtyFilter, maxPrice, matchData]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
        {/* Search Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">
            {matchData ? 'Your Perfect Matches' : 'Find Your Coach'}
          </h1>
          <p className="text-slate-500">Connect with verified professionals who align with your goals.</p>
        </div>

        {matchData && (
          <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl p-6 mb-8 flex justify-between items-center shadow-sm max-w-4xl mx-auto">
            <div className="flex items-start">
               <div className="bg-white p-2 rounded-lg mr-4 shadow-sm text-brand-600">
                  <Sparkles className="h-6 w-6" />
               </div>
               <div>
                  <p className="text-sm font-bold text-brand-900">Personalized Results</p>
                  <p className="text-xs text-brand-700 mt-1">Goal: <span className="font-semibold">{matchData.goal}</span> • Max Budget: <span className="font-semibold">£{matchData.budgetRange}</span></p>
               </div>
            </div>
            <button onClick={clearMatch} className="text-sm text-slate-500 hover:text-slate-800 font-bold flex items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow">
              <X className="h-3 w-3 mr-1" /> Clear Match
            </button>
          </div>
        )}

        {/* Floating Filter Bar */}
        <div className="sticky top-24 z-30 mb-10 max-w-4xl mx-auto">
           <div className="bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-4 py-3 border-none rounded-xl bg-slate-50 focus:bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                  placeholder="Search by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                  <select 
                    className="block w-full sm:w-48 py-3 px-4 border-none bg-slate-50 hover:bg-slate-100 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-colors appearance-none"
                    value={specialtyFilter}
                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                  >
                    <option value="">All Specialties</option>
                    <option value="Career Growth">Career Growth</option>
                    <option value="Stress Relief">Stress Relief</option>
                    <option value="Relationships">Relationships</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                  </select>

                  <div className="flex items-center space-x-3 px-4 bg-slate-50 rounded-xl min-w-[180px]">
                    <span className="text-xs font-bold text-slate-500 w-16">Max £{maxPrice}</span>
                    <input
                      type="range"
                      min="50"
                      max="500"
                      step="10"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="flex-grow h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-brand-600"
                    />
                  </div>
              </div>
           </div>
        </div>

        {/* Results */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {isLoading ? (
            // Loading skeleton - show while data is being fetched
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 animate-pulse">
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 bg-slate-200 rounded-2xl flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-slate-200 rounded w-1/3 mb-3"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : filteredCoaches.length > 0 ? (
            filteredCoaches.map((coach, index) => (
              <div key={coach.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <CoachCard
                    coach={coach}
                    matchReason={matchData ? getEnhancedMatchReason(coach, matchData) : undefined}
                    matchPercentage={matchData ? calculateMatchScore(coach, matchData) : undefined}
                  />
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Search className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No coaches found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your filters or search terms.</p>
              <button
                onClick={() => {setSpecialtyFilter(''); setMaxPrice(500); setSearchTerm('')}}
                className="mt-6 text-brand-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};