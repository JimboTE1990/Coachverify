import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  gradient?: string;
  borderColor?: string;
  iconBgColor?: string;
  iconTextColor?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = false,
  gradient = 'from-slate-50 to-slate-50',
  borderColor = 'border-slate-200',
  iconBgColor = 'bg-slate-100',
  iconTextColor = 'text-slate-600'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`relative bg-gradient-to-br ${gradient} rounded-2xl border ${borderColor} transition-all ${isOpen ? 'overflow-visible' : 'overflow-hidden'}`}>
      {/* Header - Clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`${iconBgColor} p-2 rounded-lg ${iconTextColor}`}>
              {icon}
            </div>
          )}
          <div className="text-left">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Content - Collapsible */}
      {isOpen && (
        <div className="px-6 pb-6 space-y-6 animate-fade-in-up">
          {children}
        </div>
      )}
    </div>
  );
};
