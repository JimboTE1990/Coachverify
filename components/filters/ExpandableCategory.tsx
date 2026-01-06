import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableCategoryProps {
  title: string;
  icon?: string;
  description?: string;
  badge?: number | string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const ExpandableCategory: React.FC<ExpandableCategoryProps> = ({
  title,
  icon,
  description,
  badge,
  defaultOpen = false,
  children
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Header - clickable to expand/collapse */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Icon */}
          {icon && (
            <span className="text-2xl">{icon}</span>
          )}

          {/* Title and Description */}
          <div className="text-left">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              {title}
              {badge !== undefined && badge !== 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                  {badge} selected
                </span>
              )}
            </h3>
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
        )}
      </button>

      {/* Content - only shown when expanded */}
      {isOpen && (
        <div className="px-4 pb-4 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
};

// Checkbox Grid Component for use inside ExpandableCategory
interface CheckboxGridProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  columns?: number;
}

export const CheckboxGrid: React.FC<CheckboxGridProps> = ({
  options,
  value,
  onChange,
  columns = 1
}) => {
  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className={`grid gap-3 mt-4 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {options.map(option => (
        <label
          key={option}
          className="flex items-start gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="relative flex items-center h-5">
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={() => toggleOption(option)}
              className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500 cursor-pointer"
            />
          </div>
          <span className={`text-sm flex-1 ${value.includes(option) ? 'font-medium text-slate-900' : 'text-slate-700'} group-hover:text-slate-900`}>
            {option}
          </span>
        </label>
      ))}
    </div>
  );
};
