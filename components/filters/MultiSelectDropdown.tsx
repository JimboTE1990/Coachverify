import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';

interface MultiSelectDropdownProps {
  label: string;
  placeholder?: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  maxDisplay?: number;
  optional?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  placeholder = 'Type to search or select...',
  options,
  value,
  onChange,
  maxDisplay = 3,
  optional = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle selection
  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  // Remove a selected chip
  const removeOption = (option: string) => {
    onChange(value.filter(v => v !== option));
  };

  // Clear all selections
  const clearAll = () => {
    onChange([]);
  };

  // Display text in dropdown button
  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length <= maxDisplay) {
      return value.join(', ');
    }
    return `${value.slice(0, maxDisplay).join(', ')} +${value.length - maxDisplay} more`;
  };

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      {/* Label */}
      <label className="block text-sm font-medium text-slate-700">
        {label} {optional && <span className="text-slate-400">(optional)</span>}
      </label>

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-left flex items-center justify-between hover:border-brand-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
      >
        <span className={value.length === 0 ? 'text-slate-400' : 'text-slate-900'}>
          {getDisplayText()}
        </span>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Selected Items as Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(item => (
            <div
              key={item}
              className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-sm font-medium"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => removeOption(item)}
                className="hover:bg-brand-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {value.length > 1 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-64">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No results found for "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className={`w-full px-4 py-3 text-left hover:bg-brand-50 transition-colors flex items-center justify-between group ${
                    value.includes(option) ? 'bg-brand-50' : ''
                  }`}
                >
                  <span className={`text-sm ${value.includes(option) ? 'font-medium text-brand-700' : 'text-slate-700'}`}>
                    {option}
                  </span>
                  {value.includes(option) && (
                    <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {value.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                {value.length} selected
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
