import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { getCoaches, searchCoaches } from '../services/supabaseService';
import { Coach, QuestionnaireAnswers, Specialty, Format, CoachingExpertise, CoachingLanguage, CPDQualification } from '../types';
import { CoachCard } from '../components/CoachCard';
import { FilterSidebar } from '../components/filters/FilterSidebar';
import { calculateMatchScore, getMatchReason as getEnhancedMatchReason, sortCoachesByMatch } from '../utils/matchCalculator';

export const CoachList: React.FC = () => {
  const location = useLocation();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Basic filters
  const [specialtyFilter, setSpecialtyFilter] = useState<Specialty | ''>('');
  const [formatFilter, setFormatFilter] = useState<Format[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(500);
  const [minExperience, setMinExperience] = useState<number>(0);

  // Advanced filters
  const [languageFilter, setLanguageFilter] = useState<string[]>([]);
  const [expertiseFilter, setExpertiseFilter] = useState<CoachingExpertise[]>([]);
  const [cpdFilter, setCpdFilter] = useState<CPDQualification[]>([]);

  // Mobile filter sidebar state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
      // Pre-set filters based on questionnaire
      if (q.goal) setSpecialtyFilter(q.goal);
      if (q.budgetRange) setMaxPrice(q.budgetRange);
      if (q.preferredFormat && q.preferredFormat.length > 0) setFormatFilter(q.preferredFormat);
      if (q.languagePreferences && q.languagePreferences.length > 0) setLanguageFilter(q.languagePreferences);
      if (q.coachingExpertise && q.coachingExpertise.length > 0) setExpertiseFilter(q.coachingExpertise);
      if (q.cpdQualifications && q.cpdQualifications.length > 0) setCpdFilter(q.cpdQualifications);
    }
  }, [location]);

  const clearAllFilters = () => {
    setMatchData(null);
    setSpecialtyFilter('');
    setFormatFilter([]);
    setMaxPrice(500);
    setMinExperience(0);
    setLanguageFilter([]);
    setExpertiseFilter([]);
    setCpdFilter([]);
  };

  const filteredCoaches = useMemo(() => {
    if (!coaches) return [];

    let result = coaches.filter(coach => {
      if (!coach) return false;

      // 1. Text Search (name/location)
      const name = coach.name ? coach.name.toLowerCase() : '';
      const loc = coach.location ? coach.location.toLowerCase() : '';
      const search = searchTerm.toLowerCase();
      const textMatch = name.includes(search) || loc.includes(search);

      // 2. Specialty Filter
      const specMatch = specialtyFilter
        ? (coach.specialties && coach.specialties.includes(specialtyFilter as any))
        : true;

      // 3. Format Filter
      const formatMatch = formatFilter.length > 0
        ? formatFilter.some(format => coach.availableFormats?.includes(format))
        : true;

      // 4. Price Filter
      const priceMatch = (coach.hourlyRate || 0) <= maxPrice;

      // 5. Experience Filter
      const experienceMatch = (coach.yearsExperience || 0) >= minExperience;

      // 6. Language Filter
      const languageMatch = languageFilter.length > 0
        ? languageFilter.some(lang => coach.coachingLanguages?.includes(lang as any))
        : true;

      // 7. Coaching Expertise Filter
      const expertiseMatch = expertiseFilter.length > 0
        ? expertiseFilter.some(exp => coach.coachingExpertise?.includes(exp))
        : true;

      // 8. CPD Qualifications Filter
      const cpdMatch = cpdFilter.length > 0
        ? cpdFilter.some(cpd => coach.cpdQualifications?.includes(cpd))
        : true;

      return textMatch && specMatch && formatMatch && priceMatch &&
             experienceMatch && languageMatch && expertiseMatch && cpdMatch;
    });

    // Sort by Match Relevance if matchData exists
    if (matchData) {
      result = sortCoachesByMatch(result, matchData);
    }

    return result;
  }, [coaches, searchTerm, specialtyFilter, formatFilter, maxPrice, minExperience,
      languageFilter, expertiseFilter, cpdFilter, matchData]);

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

        {/* Personalized Results Banner */}
        {matchData && (
          <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl p-6 mb-8 flex justify-between items-center shadow-sm max-w-6xl mx-auto">
            <div className="flex items-start">
               <div className="bg-white p-2 rounded-lg mr-4 shadow-sm text-brand-600">
                  <Sparkles className="h-6 w-6" />
               </div>
               <div>
                  <p className="text-sm font-bold text-brand-900">Personalized Results</p>
                  <p className="text-xs text-brand-700 mt-1">Goal: <span className="font-semibold">{matchData.goal}</span> • Max Budget: <span className="font-semibold">£{matchData.budgetRange}</span></p>
               </div>
            </div>
            <button onClick={clearAllFilters} className="text-sm text-slate-500 hover:text-slate-800 font-bold flex items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow">
              <X className="h-3 w-3 mr-1" /> Clear Match
            </button>
          </div>
        )}

        {/* Main Content with Sidebar Layout */}
        <div className="lg:flex lg:gap-8 max-w-7xl mx-auto">

          {/* Filter Sidebar - Desktop: Sticky, Mobile: Slide-in */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <FilterSidebar
              specialtyFilter={specialtyFilter}
              onSpecialtyChange={setSpecialtyFilter}
              formatFilter={formatFilter}
              onFormatChange={setFormatFilter}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              minExperience={minExperience}
              onMinExperienceChange={setMinExperience}
              languageFilter={languageFilter}
              onLanguageFilterChange={setLanguageFilter}
              expertiseFilter={expertiseFilter}
              onExpertiseFilterChange={setExpertiseFilter}
              cpdFilter={cpdFilter}
              onCpdFilterChange={setCpdFilter}
              onClearAll={clearAllFilters}
            />
          </aside>

          {/* Mobile Filter Sidebar (Slide-in) */}
          <FilterSidebar
            specialtyFilter={specialtyFilter}
            onSpecialtyChange={setSpecialtyFilter}
            formatFilter={formatFilter}
            onFormatChange={setFormatFilter}
            maxPrice={maxPrice}
            onMaxPriceChange={setMaxPrice}
            minExperience={minExperience}
            onMinExperienceChange={setMinExperience}
            languageFilter={languageFilter}
            onLanguageFilterChange={setLanguageFilter}
            expertiseFilter={expertiseFilter}
            onExpertiseFilterChange={setExpertiseFilter}
            cpdFilter={cpdFilter}
            onCpdFilterChange={setCpdFilter}
            onClearAll={clearAllFilters}
            isMobileOpen={isMobileFiltersOpen}
            onMobileClose={() => setIsMobileFiltersOpen(false)}
          />

          {/* Main Results Column */}
          <div className="flex-1 min-w-0">

            {/* Search Bar + Mobile Filter Button */}
            <div className="sticky top-24 z-30 mb-8">
              <div className="bg-white p-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex gap-2">
                  {/* Mobile Filter Toggle Button */}
                  <button
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center justify-center px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                  >
                    <SlidersHorizontal className="h-5 w-5 text-slate-600" />
                    {(specialtyFilter || formatFilter.length > 0 || maxPrice < 500 || minExperience > 0 ||
                      languageFilter.length > 0 || expertiseFilter.length > 0 || cpdFilter.length > 0) && (
                      <span className="ml-2 bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {(specialtyFilter ? 1 : 0) + formatFilter.length + (maxPrice < 500 ? 1 : 0) +
                         (minExperience > 0 ? 1 : 0) + languageFilter.length + expertiseFilter.length + cpdFilter.length}
                      </span>
                    )}
                  </button>

                  {/* Search Input */}
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
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              {isLoading ? (
                // Loading skeleton
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
                    onClick={clearAllFilters}
                    className="mt-6 text-brand-600 font-bold hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};