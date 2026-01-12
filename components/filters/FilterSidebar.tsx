import React, { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { ExpandableCategory, CheckboxGrid } from './ExpandableCategory';
import { COACHING_LANGUAGES, CPD_QUALIFICATIONS, EXPERTISE_CATEGORIES } from '../../constants/filterOptions';
import { CoachingExpertise, CoachingLanguage, CPDQualification, Specialty, Format } from '../../types';

interface FilterSidebarProps {
  // Basic filters
  specialtyFilter: Specialty | '';
  onSpecialtyChange: (value: Specialty | '') => void;

  formatFilter: Format[];
  onFormatChange: (value: Format[]) => void;

  maxPrice: number;
  onMaxPriceChange: (value: number) => void;

  currency: 'GBP' | 'USD' | 'EUR';
  onCurrencyChange: (value: 'GBP' | 'USD' | 'EUR') => void;

  minExperience: number;
  onMinExperienceChange: (value: number) => void;

  // Advanced filters
  languageFilter: string[];
  onLanguageFilterChange: (value: string[]) => void;

  expertiseFilter: CoachingExpertise[];
  onExpertiseFilterChange: (value: CoachingExpertise[]) => void;

  cpdFilter: CPDQualification[];
  onCpdFilterChange: (value: CPDQualification[]) => void;

  // Actions
  onClearAll: () => void;

  // Mobile support
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  specialtyFilter,
  onSpecialtyChange,
  formatFilter,
  onFormatChange,
  maxPrice,
  onMaxPriceChange,
  currency,
  onCurrencyChange,
  minExperience,
  onMinExperienceChange,
  languageFilter,
  onLanguageFilterChange,
  expertiseFilter,
  onExpertiseFilterChange,
  cpdFilter,
  onCpdFilterChange,
  onClearAll,
  isMobileOpen = false,
  onMobileClose
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // State to track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    specialty: true,
    format: false,
    price: false,
    experience: false
  });

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate active filter count
  const activeFilterCount =
    (specialtyFilter ? 1 : 0) +
    formatFilter.length +
    (maxPrice < 500 ? 1 : 0) +
    (minExperience > 0 ? 1 : 0) +
    languageFilter.length +
    expertiseFilter.length +
    cpdFilter.length;

  // Get selected count for a category
  const getSelectedCountForCategory = (categoryItems: string[]): number => {
    return expertiseFilter.filter(item => categoryItems.includes(item)).length;
  };

  const toggleFormat = (format: Format) => {
    if (formatFilter.includes(format)) {
      onFormatChange(formatFilter.filter(f => f !== format));
    } else {
      onFormatChange([...formatFilter, format]);
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {isMobileOpen && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        )}
      </div>

      {/* Filters Content */}
      <div className="flex-1 overflow-y-auto overflow-x-visible p-6 space-y-4">

        {/* Specialty Filter */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('specialty')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm font-bold text-slate-700">Specialty</span>
            {expandedSections.specialty ? (
              <Minus className="h-4 w-4 text-slate-600" />
            ) : (
              <Plus className="h-4 w-4 text-slate-600" />
            )}
          </button>
          {expandedSections.specialty && (
            <div className="px-4 pb-4">
              <select
                value={specialtyFilter}
                onChange={(e) => onSpecialtyChange(e.target.value as Specialty | '')}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
              >
                <option value="">All Specialties</option>
                <option value="Career Growth">Career Growth</option>
                <option value="Stress Relief">Stress Relief</option>
                <option value="Relationships">Relationships</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Executive Coaching">Executive Coaching</option>
              </select>
            </div>
          )}
        </div>

        {/* Format Filter */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('format')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm font-bold text-slate-700">Format</span>
            {expandedSections.format ? (
              <Minus className="h-4 w-4 text-slate-600" />
            ) : (
              <Plus className="h-4 w-4 text-slate-600" />
            )}
          </button>
          {expandedSections.format && (
            <div className="px-4 pb-4 space-y-2">
              {(['In-Person', 'Online', 'Hybrid'] as Format[]).map((format) => (
                <label
                  key={format}
                  className="flex items-center p-3 border border-slate-200 rounded-xl hover:border-brand-300 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formatFilter.includes(format)}
                    onChange={() => toggleFormat(format)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-slate-700">{format}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Max Hourly Rate */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm font-bold text-slate-700">Max Hourly Rate: {currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}{maxPrice}</span>
            {expandedSections.price ? (
              <Minus className="h-4 w-4 text-slate-600" />
            ) : (
              <Plus className="h-4 w-4 text-slate-600" />
            )}
          </button>
          {expandedSections.price && (
            <div className="px-4 pb-4">
              {/* Currency Selector */}
              <div className="mb-3 flex gap-2">
                {[
                  { code: 'GBP', symbol: '£' },
                  { code: 'USD', symbol: '$' },
                  { code: 'EUR', symbol: '€' }
                ].map((curr) => (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => onCurrencyChange(curr.code as 'GBP' | 'USD' | 'EUR')}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currency === curr.code
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {curr.symbol}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>{currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}50</span>
                <span>{currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}250</span>
                <span>{currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}500+</span>
              </div>
            </div>
          )}
        </div>

        {/* Min Years Experience */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('experience')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm font-bold text-slate-700">
              Min Years Experience: {minExperience} {minExperience === 1 ? 'year' : 'years'}
            </span>
            {expandedSections.experience ? (
              <Minus className="h-4 w-4 text-slate-600" />
            ) : (
              <Plus className="h-4 w-4 text-slate-600" />
            )}
          </button>
          {expandedSections.experience && (
            <div className="px-4 pb-4">
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={minExperience}
                onChange={(e) => onMinExperienceChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>Any</span>
                <span>10 yrs</span>
                <span>20+ yrs</span>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        <div className="border-t border-slate-200 pt-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <span className="font-bold text-slate-900 text-sm">Advanced Filters</span>
            {showAdvanced ? (
              <ChevronUp className="h-5 w-5 text-slate-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-600" />
            )}
          </button>
        </div>

        {/* Advanced Filters Content */}
        {showAdvanced && (
          <div className="space-y-6 animate-fade-in">

            {/* Languages */}
            <div>
              <MultiSelectDropdown
                label="Languages"
                placeholder="Select languages..."
                options={COACHING_LANGUAGES}
                value={languageFilter}
                onChange={onLanguageFilterChange}
                maxDisplay={2}
                optional={true}
              />
            </div>

            {/* Coaching Expertise */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Coaching Expertise <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {EXPERTISE_CATEGORIES.map(category => (
                  <ExpandableCategory
                    key={category.name}
                    title={category.name}
                    icon={category.icon}
                    description={category.description}
                    badge={getSelectedCountForCategory(category.items)}
                    defaultOpen={false}
                  >
                    <CheckboxGrid
                      options={category.items}
                      value={expertiseFilter}
                      onChange={(value) => onExpertiseFilterChange(value as CoachingExpertise[])}
                      columns={1}
                    />
                  </ExpandableCategory>
                ))}
              </div>
              {expertiseFilter.length > 0 && (
                <div className="mt-2 text-xs text-slate-500 text-center">
                  {expertiseFilter.length} area(s) selected
                </div>
              )}
            </div>

            {/* CPD Qualifications */}
            <div>
              <MultiSelectDropdown
                label="CPD Qualifications"
                placeholder="Search certifications..."
                options={CPD_QUALIFICATIONS}
                value={cpdFilter}
                onChange={(value) => onCpdFilterChange(value as CPDQualification[])}
                maxDisplay={2}
                optional={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
        <button
          onClick={onMobileClose}
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-md hover:shadow-lg"
        >
          Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
        <button
          onClick={onClearAll}
          disabled={activeFilterCount === 0}
          className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );

  // Desktop: Fixed sidebar (always visible on lg+)
  // Mobile: Slide-in drawer (only visible when isMobileOpen is true)

  // If on mobile and drawer is closed, don't render anything
  if (!isMobileOpen && onMobileClose) {
    return null;
  }

  return (
    <>
      {/* Mobile Overlay - only show on mobile when drawer is open */}
      {isMobileOpen && onMobileClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${onMobileClose ? 'fixed' : 'sticky top-24'}
          ${onMobileClose ? 'top-0 left-0' : ''}
          ${onMobileClose ? 'h-screen' : 'h-[calc(100vh-7rem)] max-h-[900px]'}
          bg-white
          ${onMobileClose ? 'z-50 w-80' : 'w-full'}
          ${onMobileClose ? 'lg:hidden' : ''}
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen && onMobileClose ? 'translate-x-0' : ''}
          ${!isMobileOpen && onMobileClose ? '-translate-x-full' : ''}
          ${!onMobileClose ? 'rounded-2xl border border-slate-200 shadow-sm' : ''}
          overflow-hidden flex flex-col
        `}
      >
        {sidebarContent}
      </div>
    </>
  );
};
