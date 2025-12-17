import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LayoutDashboard, Edit3, CreditCard, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const ProfileDropdown: React.FC = () => {
  const { coach, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/');
  };

  if (!coach) return null;

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name || name.trim() === '') return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, Math.min(2, name.length)).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {/* Avatar */}
        {coach.photoUrl ? (
          <img
            src={coach.photoUrl}
            alt={coach.name}
            className="h-10 w-10 rounded-full object-cover border-2 border-slate-200"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border-2 border-slate-200">
            {getInitials(coach.name)}
          </div>
        )}

        {/* Name & Chevron (hidden on mobile) */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">{coach.name ? coach.name.split(' ')[0] : 'Coach'}</p>
            {coach.subscriptionStatus === 'trial' && (
              <p className="text-xs text-brand-600 font-semibold">Trial Active</p>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-sm font-bold text-slate-900">{coach.name || 'Coach'}</p>
            <p className="text-xs text-slate-500 truncate">{coach.email || ''}</p>
            {coach.subscriptionStatus === 'trial' && (
              <div className="mt-2 inline-flex items-center bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                Free Trial Active
              </div>
            )}
            {coach.subscriptionStatus === 'active' && (
              <div className="mt-2 inline-flex items-center bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                Active Subscription
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              to="/for-coaches"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors text-slate-700 hover:text-brand-600"
            >
              <LayoutDashboard className="h-5 w-5 mr-3 text-slate-400" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>

            <Link
              to="/for-coaches?tab=profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors text-slate-700 hover:text-brand-600"
            >
              <Edit3 className="h-5 w-5 mr-3 text-slate-400" />
              <span className="text-sm font-medium">Edit Profile</span>
            </Link>

            <Link
              to="/for-coaches?tab=subscription"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors text-slate-700 hover:text-brand-600"
            >
              <CreditCard className="h-5 w-5 mr-3 text-slate-400" />
              <span className="text-sm font-medium">Subscription</span>
            </Link>

            <Link
              to="/for-coaches?tab=account"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors text-slate-700 hover:text-brand-600"
            >
              <Settings className="h-5 w-5 mr-3 text-slate-400" />
              <span className="text-sm font-medium">Account Settings</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-slate-100 py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
