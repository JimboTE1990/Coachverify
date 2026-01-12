import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Sparkles, Bone, AlertCircle } from 'lucide-react';
import { getCoaches } from '../services/supabaseService';
import { Coach, QuestionnaireAnswers, Specialty, Format, CoachingExpertise, CoachingLanguage, CPDQualification } from '../types';
import { CoachCard } from '../components/CoachCard';
import { FilterSidebar } from '../components/filters/FilterSidebar';
import { calculateMatchScore, getMatchReason as getEnhancedMatchReason } from '../utils/matchCalculator';

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
  const [genderFilter, setGenderFilter] = useState<string[]>([]);

  // Mobile filter sidebar state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Partial match toggle
  const [showPartialMatches, setShowPartialMatches] = useState(false);
  const [minMatchPercentage] = useState(50); // Minimum 50% match to show

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
      if (q.genderPreference && q.genderPreference.length > 0) setGenderFilter(q.genderPreference);
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
    setGenderFilter([]);
  };

  // Calculate match percentage for each coach
  const calculateFilterMatchPercentage = (coach: Coach): {
    percentage: number;
    matched: string[];
    total: number;
  } => {
    const criteria = [];
    const matched = [];

    // 1. Text Search (always passes if empty)
    const name = coach.name ? coach.name.toLowerCase() : '';
    const loc = coach.location ? coach.location.toLowerCase() : '';
    const search = searchTerm.toLowerCase();
    if (searchTerm) {
      criteria.push('Search term');
      if (name.includes(search) || loc.includes(search)) {
        matched.push('Search term');
      }
    }

    // 2. Specialty Filter
    if (specialtyFilter) {
      criteria.push('Specialty');
      if (coach.specialties && coach.specialties.includes(specialtyFilter as any)) {
        matched.push('Specialty');
      }
    }

    // 3. Format Filter
    if (formatFilter.length > 0) {
      criteria.push('Format');
      if (formatFilter.some(format => coach.availableFormats?.includes(format))) {
        matched.push('Format');
      }
    }

    // 4. Price Filter (always add if not default)
    if (maxPrice < 500) {
      criteria.push('Price range');
      if ((coach.hourlyRate || 0) <= maxPrice) {
        matched.push('Price range');
      }
    }

    // 5. Experience Filter
    if (minExperience > 0) {
      criteria.push('Experience');
      if ((coach.yearsExperience || 0) >= minExperience) {
        matched.push('Experience');
      }
    }

    // 6. Language Filter
    if (languageFilter.length > 0) {
      criteria.push('Languages');
      if (languageFilter.some(lang => coach.coachingLanguages?.includes(lang as any))) {
        matched.push('Languages');
      }
    }

    // 7. Coaching Expertise Filter
    if (expertiseFilter.length > 0) {
      criteria.push('Expertise areas');
      if (expertiseFilter.some(exp => coach.coachingExpertise?.includes(exp))) {
        matched.push('Expertise areas');
      }
    }

    // 8. CPD Qualifications Filter
    if (cpdFilter.length > 0) {
      criteria.push('Qualifications');
      if (cpdFilter.some(cpd => coach.cpdQualifications?.includes(cpd))) {
        matched.push('Qualifications');
      }
    }

    // 9. Gender Filter
    if (genderFilter.length > 0) {
      criteria.push('Gender');
      if (coach.gender && genderFilter.includes(coach.gender)) {
        matched.push('Gender');
      }
    }

    const total = criteria.length;
    const percentage = total === 0 ? 100 : Math.round((matched.length / total) * 100);

    return { percentage, matched, total };
  };

  const filteredCoaches = useMemo(() => {
    if (!coaches) return [];

    // Calculate match percentage for each coach
    const coachesWithScores = coaches.map(coach => ({
      coach,
      filterMatch: calculateFilterMatchPercentage(coach)
    }));

    // Filter based on whether we're showing partial matches
    let result = coachesWithScores.filter(({ filterMatch }) => {
      if (showPartialMatches) {
        // Show coaches with at least minMatchPercentage% match
        return filterMatch.percentage >= minMatchPercentage;
      } else {
        // Only show 100% matches
        return filterMatch.percentage === 100;
      }
    });

    // Sort by Match Relevance if matchData exists, otherwise by filter match percentage
    if (matchData) {
      result = result.sort((a, b) => {
        const scoreA = calculateMatchScore(a.coach, matchData);
        const scoreB = calculateMatchScore(b.coach, matchData);
        return scoreB - scoreA;
      });
    } else {
      result = result.sort((a, b) => b.filterMatch.percentage - a.filterMatch.percentage);
    }

    return result.map(r => r.coach);
  }, [coaches, searchTerm, specialtyFilter, formatFilter, maxPrice, minExperience,
      languageFilter, expertiseFilter, cpdFilter, genderFilter, matchData, showPartialMatches, minMatchPercentage]);

  // Calculate counts for perfect and partial matches
  const perfectMatchCount = useMemo(() => {
    if (!coaches) return 0;
    return coaches.filter(coach => calculateFilterMatchPercentage(coach).percentage === 100).length;
  }, [coaches, searchTerm, specialtyFilter, formatFilter, maxPrice, minExperience,
      languageFilter, expertiseFilter, cpdFilter, genderFilter]);

  const partialMatchCount = useMemo(() => {
    if (!coaches) return 0;
    return coaches.filter(coach => {
      const match = calculateFilterMatchPercentage(coach);
      return match.percentage >= minMatchPercentage && match.percentage < 100;
    }).length;
  }, [coaches, searchTerm, specialtyFilter, formatFilter, maxPrice, minExperience,
      languageFilter, expertiseFilter, cpdFilter, genderFilter, minMatchPercentage]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Search Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">
            {matchData ? '🐾 Your Perfect Matches' : '🦴 Sniffing Out Your Perfect Coach'}
          </h1>
          <p className="text-slate-500">
            {isLoading
              ? '🐕 Fetching results...'
              : 'Connect with verified professionals who align with your goals.'}
          </p>
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

        {/* Currency Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 max-w-6xl mx-auto">
          <p className="text-sm text-amber-900">
            <span className="font-bold">ℹ️ Currency Notice:</span> Pricing is displayed in each coach's local currency. For international clients, please consider that currency conversion rates may impact actual pricing day to day.
          </p>
        </div>

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
              genderFilter={genderFilter}
              onGenderFilterChange={setGenderFilter}
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
            genderFilter={genderFilter}
            onGenderFilterChange={setGenderFilter}
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
                      languageFilter.length > 0 || expertiseFilter.length > 0 || cpdFilter.length > 0 || genderFilter.length > 0) && (
                      <span className="ml-2 bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {(specialtyFilter ? 1 : 0) + formatFilter.length + (maxPrice < 500 ? 1 : 0) +
                         (minExperience > 0 ? 1 : 0) + languageFilter.length + expertiseFilter.length + cpdFilter.length + genderFilter.length}
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
                <>
                  {/* Perfect Matches Section Header */}
                  {!showPartialMatches && perfectMatchCount > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <Bone className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-green-900">🎯 Perfect Matches!</p>
                          <p className="text-sm text-green-700">These coaches match 100% of your criteria</p>
                        </div>
                      </div>
                      <span className="bg-green-600 text-white px-4 py-2 rounded-full font-bold text-sm">
                        {perfectMatchCount} {perfectMatchCount === 1 ? 'Coach' : 'Coaches'}
                      </span>
                    </div>
                  )}

                  {filteredCoaches.map((coach, index) => (
                    <div key={coach.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <CoachCard
                        coach={coach}
                        matchReason={matchData ? getEnhancedMatchReason(coach, matchData) : undefined}
                        matchPercentage={matchData ? calculateMatchScore(coach, matchData) : undefined}
                        filterMatchPercentage={showPartialMatches ? calculateFilterMatchPercentage(coach).percentage : undefined}
                      />
                    </div>
                  ))}

                  {/* Partial Match Toggle - Show after perfect matches */}
                  {!showPartialMatches && perfectMatchCount > 0 && partialMatchCount > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6 text-center">
                      <Bone className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-amber-900 mb-2">
                        🐕 Want more options?
                      </h3>
                      <p className="text-amber-700 mb-4">
                        We found <strong>{partialMatchCount} coaches</strong> who are close matches (50%+ criteria)
                      </p>
                      <button
                        onClick={() => setShowPartialMatches(true)}
                        className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        Show Close Matches
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // No results - Dog-themed with smart suggestions
                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                  <div className="mb-6">
                    <img src="/dog-mascot.png" alt="CoachDog Dalmatian" className="w-32 h-32 mx-auto opacity-50" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">🦴 No bones found!</h3>
                  <p className="text-slate-600 mb-6">
                    We couldn't sniff out any coaches matching all your criteria.
                  </p>

                  {/* Smart Suggestions */}
                  {!showPartialMatches && partialMatchCount > 0 ? (
                    <div className="bg-brand-50 border border-brand-200 rounded-xl p-6 max-w-md mx-auto mb-6">
                      <AlertCircle className="h-6 w-6 text-brand-600 mx-auto mb-3" />
                      <p className="text-brand-900 font-bold mb-2">💡 Try this:</p>
                      <p className="text-brand-700 text-sm mb-4">
                        We found {partialMatchCount} coaches who match at least 50% of your criteria
                      </p>
                      <button
                        onClick={() => setShowPartialMatches(true)}
                        className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-brand-700 transition-all w-full"
                      >
                        Show Close Matches
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-md mx-auto mb-6 text-left">
                      <p className="font-bold text-slate-900 mb-3">🐾 Try these tips:</p>
                      <ul className="space-y-2 text-sm text-slate-700">
                        {cpdFilter.length > 0 && (
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span><strong>Remove some qualifications</strong> - Fewer requirements = more coaches</span>
                          </li>
                        )}
                        {expertiseFilter.length > 0 && (
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span><strong>Broaden expertise areas</strong> - Try selecting fewer specific skills</span>
                          </li>
                        )}
                        {maxPrice < 500 && (
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span><strong>Increase your budget</strong> - Try raising the max price to £{maxPrice + 50}</span>
                          </li>
                        )}
                        {minExperience > 5 && (
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span><strong>Lower experience requirement</strong> - Try {minExperience - 2} years instead</span>
                          </li>
                        )}
                        {languageFilter.length > 1 && (
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span><strong>Reduce language filters</strong> - Focus on your primary language</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={clearAllFilters}
                    className="text-brand-600 font-bold hover:underline"
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