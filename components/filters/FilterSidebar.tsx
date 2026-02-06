import React, { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { ExpandableCategory, CheckboxGrid } from './ExpandableCategory';
import { COACHING_LANGUAGES, CPD_QUALIFICATIONS, EXPERTISE_CATEGORIES } from '../../constants/filterOptions';
import { CoachingExpertise, CoachingLanguage, CPDQualification, Specialty, Format } from '../../types';
import { UK_CITIES, LOCATION_RADIUS_OPTIONS } from '../../constants/locations';

interface FilterSidebarProps {
  // Basic filters
  specialtyFilter: Specialty | '';
  onSpecialtyChange: (value: Specialty | '') => void;

  formatFilter: Format[];
  onFormatChange: (value: Format[]) => void;

  maxPrice: number;
  onMaxPriceChange: (value: number) => void;


  minExperience: number;
  onMinExperienceChange: (value: number) => void;

  // Location filters
  locationCityFilter: string;
  onLocationCityChange: (value: string) => void;

  locationRadiusFilter: string;
  onLocationRadiusChange: (value: string) => void;

  // Advanced filters
  languageFilter: string[];
  onLanguageFilterChange: (value: string[]) => void;

  expertiseFilter: CoachingExpertise[];
  onExpertiseFilterChange: (value: CoachingExpertise[]) => void;

  cpdFilter: CPDQualification[];
  onCpdFilterChange: (value: CPDQualification[]) => void;

  genderFilter: string[];
  onGenderFilterChange: (value: string[]) => void;

  // Actions
  onClearAll: () => void;
  onApply?: () => void; // NEW: Callback when Apply Filters is clicked

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
  minExperience,
  onMinExperienceChange,
  locationCityFilter,
  onLocationCityChange,
  locationRadiusFilter,
  onLocationRadiusChange,
  languageFilter,
  onLanguageFilterChange,
  expertiseFilter,
  onExpertiseFilterChange,
  cpdFilter,
  onCpdFilterChange,
  genderFilter,
  onGenderFilterChange,
  onClearAll,
  onApply,
  isMobileOpen = false,
  onMobileClose
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // State to track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    specialty: true,
    format: false,
    price: false,
    experience: false,
    location: false
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
    (locationCityFilter ? 1 : 0) +
    (locationRadiusFilter ? 1 : 0) +
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
            <span className="text-sm font-bold text-slate-700">Max Hourly Rate: £{maxPrice}</span>
            {expandedSections.price ? (
              <Minus className="h-4 w-4 text-slate-600" />
            ) : (
              <Plus className="h-4 w-4 text-slate-600" />
            )}
          </button>
          {expandedSections.price && (
            <div className="px-4 pb-4">
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
                <span>£50</span>
                <span>£250</span>
                <span>£500+</span>
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

        {/* Location Filter */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('location')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm font-bold text-slate-700">Location</span>
            {expandedSections.location ? (
              <Minus className="h-4 w-4 text-slate-600" />
            ) : (
              <Plus className="h-4 w-4 text-slate-600" />
            )}
          </button>
          {expandedSections.location && (
            <div className="px-4 pb-4 space-y-3">
              {/* City/Town Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">City/Town</label>
                <select
                  value={locationCityFilter}
                  onChange={(e) => onLocationCityChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white text-sm"
                >
                  <option value="">All locations</option>
                  <option value="Remote">Remote Only</option>
                  <optgroup label="UK Cities">
                    {UK_CITIES.filter(city => city !== 'Other' && city !== 'Remote').map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Travel Radius Filter */}
              {locationCityFilter && locationCityFilter !== 'Remote' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Travel Radius</label>
                  <select
                    value={locationRadiusFilter}
                    onChange={(e) => onLocationRadiusChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white text-sm"
                  >
                    <option value="">Any distance</option>
                    {LOCATION_RADIUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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

            {/* Gender Preference */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Coach Gender <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="space-y-2">
                {['Male', 'Female', 'Non-binary'].map((gender) => (
                  <label
                    key={gender}
                    className="flex items-center p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={genderFilter.includes(gender)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onGenderFilterChange([...genderFilter, gender]);
                        } else {
                          onGenderFilterChange(genderFilter.filter(g => g !== gender));
                        }
                      }}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-slate-800">{gender}</span>
                  </label>
                ))}
              </div>
              {genderFilter.length > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  {genderFilter.length} selected
                </div>
              )}
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
          onClick={() => {
            setIsApplying(true);
            // Call onApply callback if provided
            if (onApply) {
              onApply();
            }
            // Close mobile drawer if on mobile
            if (onMobileClose) {
              onMobileClose();
            }
            // Reset animation state
            setTimeout(() => setIsApplying(false), 600);
          }}
          disabled={isApplying}
          className={`
            w-full bg-brand-600 text-white py-3 rounded-xl font-bold
            hover:bg-brand-700 transition-all shadow-md hover:shadow-lg
            disabled:opacity-75
            ${isApplying ? 'scale-95' : 'scale-100'}
          `}
        >
          {isApplying ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Applying...
            </span>
          ) : (
            <>Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</>
          )}
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
