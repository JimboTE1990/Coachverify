// DEV POC — standalone nav, does not touch Layout.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export const PocNav: React.FC = () => {
  const { pathname } = useLocation();
  const { coach } = useAuth();
  const [newQuestionCount, setNewQuestionCount] = useState(0);

  const isResources = pathname.startsWith('/insights-poc/resources');
  const isCoachHub = pathname.startsWith('/insights-poc/coach-hub');
  const isCommunity = !isResources && !isCoachHub;

  // Check for new community questions since last visit (coaches only)
  useEffect(() => {
    if (!coach) return;
    const lastCheck = localStorage.getItem('cd_community_last_check');
    const since = lastCheck ?? new Date(0).toISOString();

    supabase
      .from('community_threads')
      .select('id', { count: 'exact', head: true })
      .gt('created_at', since)
      .then(({ count }) => {
        if (count && count > 0) setNewQuestionCount(count);
      });
  }, [coach]);

  // Clear badge when visiting community (or when count loads while already there)
  useEffect(() => {
    if (isCommunity && newQuestionCount > 0) {
      localStorage.setItem('cd_community_last_check', new Date().toISOString());
      setNewQuestionCount(0);
    }
  }, [isCommunity, newQuestionCount]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

        {/* Logo */}
        <Link to="/insights-poc" className="flex items-center gap-2 font-display font-extrabold text-slate-900 text-base">
          <span>🐾</span>
          <span>CoachDog</span>
        </Link>

        {/* Tabs */}
        <nav className="flex items-center gap-1">
          <Link
            to="/insights-poc"
            className={`relative px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              isCommunity ? 'text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
            style={isCommunity ? { backgroundColor: '#2D8A7E' } : {}}
          >
            Community
            {newQuestionCount > 0 && !isCommunity && (
              <span
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                title={`${newQuestionCount} new question${newQuestionCount !== 1 ? 's' : ''}`}
              >
                {newQuestionCount > 9 ? '9+' : newQuestionCount}
              </span>
            )}
          </Link>
          <Link
            to="/insights-poc/resources"
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              isResources ? 'text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
            style={isResources ? { backgroundColor: '#2D8A7E' } : {}}
          >
            Resources
          </Link>
          <Link
            to="/insights-poc/coach-hub"
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
              isCoachHub ? 'text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
            style={isCoachHub ? { backgroundColor: '#2D8A7E' } : {}}
          >
            Coach Hub
            {!coach && <span className="text-xs opacity-60">🔒</span>}
          </Link>
        </nav>

        {/* POC badge */}
        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full hidden sm:inline">
          POC Preview
        </span>
      </div>
    </header>
  );
};
