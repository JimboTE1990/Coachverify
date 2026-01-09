import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, Search, ChevronDown } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  maxHeight?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  maxHeight = '300px',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const position = {
        top: rect.bottom + 8, // Use fixed positioning, no need for scrollY
        left: rect.left,
        width: rect.width
      };
      setDropdownPosition(position);
    } else if (!isOpen) {
      // Reset position when closed to ensure fresh calculation on next open
      setDropdownPosition({ top: 0, left: 0, width: 0 });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeItem = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== option));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const dropdownContent = isOpen && dropdownPosition.width > 0 && (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border-4 border-brand-600 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-8 ring-brand-500/30 backdrop-blur-sm"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`
      }}
    >
      {/* Search Input */}
      <div className="p-3 border-b-2 border-brand-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Options List */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {filteredOptions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            No items found
          </div>
        ) : (
          <div className="p-2">
            {filteredOptions.map(option => {
              const isSelected = selected.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm
                    transition-colors text-left
                    ${
                      isSelected
                        ? 'bg-brand-50 text-brand-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <span>{option}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-brand-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with selection count */}
      {selected.length > 0 && (
        <div className="px-4 py-3 border-t-2 border-brand-200 bg-gradient-to-t from-brand-50 to-white text-xs text-brand-800 font-bold">
          {selected.length} {selected.length === 1 ? 'item' : 'items'} selected
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Selected Items Display / Trigger */}
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          min-h-[48px] w-full border border-slate-200 bg-white rounded-xl px-3 py-2
          cursor-pointer transition-all
          ${isOpen ? 'ring-2 ring-brand-500 border-brand-500' : 'hover:border-slate-300'}
        `}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 flex flex-wrap gap-1.5">
            {selected.length === 0 ? (
              <span className="text-slate-400 text-sm py-1">{placeholder}</span>
            ) : (
              selected.map(item => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 bg-brand-100 text-brand-800 px-2 py-1 rounded-md text-xs font-medium"
                >
                  {item}
                  <button
                    onClick={(e) => removeItem(item, e)}
                    className="hover:bg-brand-200 rounded-sm p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {selected.length > 0 && (
              <button
                onClick={clearAll}
                className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
                title="Clear all"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Render dropdown as portal */}
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
};
