import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';
import { UK_CITIES_GROUPED } from '../../constants/locations';

interface SearchableLocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyOption?: string;
  /** Extra options to show above the grouped city list (e.g. "Remote") */
  topOptions?: Array<{ value: string; label: string }>;
  /** Show an "Other (custom)" option at the bottom */
  showOtherOption?: boolean;
  className?: string;
  /** Slightly smaller text/padding — for filter sidebar */
  compact?: boolean;
}

export const SearchableLocationSelect: React.FC<SearchableLocationSelectProps> = ({
  value,
  onChange,
  placeholder = 'Select a city...',
  emptyOption,
  topOptions = [],
  showOtherOption = false,
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when menu opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const open = () => {
    setIsOpen(true);
    setSearch('');
  };

  const select = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Filter cities by search term
  const query = search.toLowerCase().trim();
  const filteredGroups = UK_CITIES_GROUPED.map(group => ({
    label: group.label,
    cities: query
      ? group.cities.filter(c => c.toLowerCase().includes(query))
      : group.cities,
  })).filter(g => g.cities.length > 0);

  // Display label for current value
  const displayLabel = (() => {
    if (!value) return '';
    const topMatch = topOptions.find(o => o.value === value);
    if (topMatch) return topMatch.label;
    if (value === 'Other') return 'Other (custom)';
    return value;
  })();

  const triggerBase = compact
    ? 'w-full px-3 py-2 text-sm'
    : 'w-full px-4 py-3 text-base';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={isOpen ? () => { setIsOpen(false); setSearch(''); } : open}
        className={`${triggerBase} flex items-center justify-between border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors hover:bg-slate-50 ${isOpen ? 'ring-2 ring-brand-500 border-brand-500' : ''}`}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {displayLabel || placeholder}
        </span>
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {value && (
            <span
              onClick={clear}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              title="Clear"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search box */}
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cities..."
                className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto">
            {/* Empty / any-location option */}
            {emptyOption && !query && (
              <button
                type="button"
                onClick={() => select('')}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${!value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-600'}`}
              >
                {emptyOption}
              </button>
            )}

            {/* Top options (e.g. Remote) */}
            {!query && topOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => select(opt.value)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${value === opt.value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-700'}`}
              >
                {opt.label}
              </button>
            ))}

            {/* Divider after top options */}
            {!query && (emptyOption || topOptions.length > 0) && (
              <div className="border-t border-slate-100 mx-2 my-1" />
            )}

            {/* Grouped city list */}
            {filteredGroups.length > 0 ? (
              filteredGroups.map(group => (
                <div key={group.label}>
                  <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50 sticky top-0">
                    {group.label}
                  </div>
                  {group.cities.map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => select(city)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${value === city ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-700'}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-slate-400 text-center">
                No cities match "{search}"
              </div>
            )}

            {/* Other option */}
            {showOtherOption && !query && (
              <>
                <div className="border-t border-slate-100 mx-2 my-1" />
                <button
                  type="button"
                  onClick={() => select('Other')}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${value === 'Other' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-500 italic'}`}
                >
                  Other (enter manually)
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
