import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import type { ViewMode } from '../../hooks/useDeviceDetection';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
  className?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onToggle,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center bg-slate-100 rounded-xl p-1 ${className}`}>
      <button
        onClick={() => onToggle('mobile')}
        className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${
          viewMode === 'mobile'
            ? 'bg-white text-brand-600 shadow-sm'
            : 'text-slate-600 hover:text-slate-800'
        }`}
        title="Mobile View"
      >
        <Smartphone className="h-4 w-4 mr-2" />
        Mobile
      </button>
      <button
        onClick={() => onToggle('desktop')}
        className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${
          viewMode === 'desktop'
            ? 'bg-white text-brand-600 shadow-sm'
            : 'text-slate-600 hover:text-slate-800'
        }`}
        title="Desktop View"
      >
        <Monitor className="h-4 w-4 mr-2" />
        Desktop
      </button>
    </div>
  );
};
