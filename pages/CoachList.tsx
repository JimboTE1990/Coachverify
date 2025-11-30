import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { getCoaches } from '../services/mockData';
import { Coach, QuestionnaireAnswers } from '../types';
import { CoachCard } from '../components/CoachCard';

export const CoachList: React.FC = () => {
  const location = useLocation();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for filters
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(300);

  // Questionnaire results passed from Onboarding
  const [matchData, setMatchData] = useState<QuestionnaireAnswers | null>(null);

  useEffect(() => {
    // Load initial data
    setCoaches(getCoaches());

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
    let result = coaches.filter(coach => {
      // 1. Text Search
      const textMatch = coach.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        coach.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Specialty Filter
      const specMatch = specialtyFilter ? coach.specialties.includes(specialtyFilter as any) : true;
      
      // 3. Price Filter
      const priceMatch = coach.hourlyRate <= maxPrice;

      return textMatch && specMatch && priceMatch;
    });

    // 4. Sort by Match Relevance if matchData exists
    if (matchData) {
      result = result.sort((a, b) => {
        // Simple scoring
        const scoreA = (a.specialties.includes(matchData.goal as any) ? 10 : 0) + 
                       (a.hourlyRate <= matchData.budgetRange ? 5 : 0) +
                       (a.availableFormats.some(f => matchData.preferredFormat.includes(f)) ? 3 : 0);
                       
        const scoreB = (b.specialties.includes(matchData.goal as any) ? 10 : 0) + 
                       (b.hourlyRate <= matchData.budgetRange ? 5 : 0) +
                       (b.availableFormats.some(f => matchData.preferredFormat.includes(f)) ? 3 : 0);
        
        return scoreB - scoreA;
      });
    }

    return result;
  }, [coaches, searchTerm, specialtyFilter, maxPrice, matchData]);

  const getMatchReason = (coach: Coach) => {
    if (!matchData) return undefined;
    
    const reasons = [];
    if (coach.specialties.includes(matchData.goal as any)) reasons.push(`Specializes in ${matchData.goal}`);
    if (coach.hourlyRate <= matchData.budgetRange) reasons.push("Fits your budget");
    const formatMatch = coach.availableFormats.filter(f => matchData.preferredFormat.includes(f));
    if (formatMatch.length > 0) reasons.push(`Available ${formatMatch[0].toLowerCase()}`);

    if (reasons.length === 0) return "General recommendation";
    return reasons.join(" • ");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Search Header */}
      <div className="mb-8">
         <h1 className="text-3xl font-bold text-slate-900 mb-4">
           {matchData ? `We found ${filteredCoaches.length} matches for you` : 'Find your coach'}
         </h1>
         
         {matchData && (
           <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6 flex justify-between items-center">
             <div>
                <p className="text-sm text-brand-800 font-medium">Showing results based on your questionnaire.</p>
                <p className="text-xs text-brand-600 mt-1">Goal: {matchData.goal} • Budget: ${matchData.budgetRange}</p>
             </div>
             <button onClick={clearMatch} className="text-sm text-slate-500 hover:text-slate-800 flex items-center bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
               <X className="h-3 w-3 mr-1" /> Clear Filter
             </button>
           </div>
         )}

         {/* Filter Bar */}
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <select 
                  className="block w-full py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                >
                  <option value="">All Specialties</option>
                  <option value="Career Growth">Career Growth</option>
                  <option value="Stress Relief">Stress Relief</option>
                  <option value="Relationships">Relationships</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                </select>

                <div className="flex items-center space-x-2 min-w-[200px]">
                   <span className="text-sm text-slate-600 w-16">Max ${maxPrice}</span>
                   <input 
                    type="range" 
                    min="50" 
                    max="500" 
                    step="10" 
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="flex-grow h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                   />
                </div>
            </div>
         </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {filteredCoaches.length > 0 ? (
          filteredCoaches.map(coach => (
            <CoachCard 
              key={coach.id} 
              coach={coach} 
              matchReason={getMatchReason(coach)}
            />
          ))
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500">No coaches found matching your criteria.</p>
            <button 
              onClick={() => {setSpecialtyFilter(''); setMaxPrice(500); setSearchTerm('')}}
              className="mt-4 text-brand-600 font-medium hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};