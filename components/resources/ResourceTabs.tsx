import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Lock } from 'lucide-react';

export const ResourceTabs: React.FC = () => {
  const { pathname } = useLocation();
  const isPremium = pathname.startsWith('/resources/premium');

  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 rounded-full p-1 mb-8">
      <Link
        to="/resources"
        className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
          isPremium ? 'text-slate-500 hover:text-slate-700' : 'bg-white text-emerald-700 shadow-sm'
        }`}
      >
        <BookOpen className="h-4 w-4" /> Free Resources
      </Link>
      <Link
        to="/resources/premium"
        className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
          isPremium ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Lock className="h-4 w-4" /> Premium Resources
      </Link>
    </div>
  );
};
