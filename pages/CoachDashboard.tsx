import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { updateCoach, getCoachAnalytics, type CoachAnalytics } from '../services/supabaseService';
import { Coach, Specialty, Format } from '../types';
import {
  User, Settings, CreditCard, Lock, LogOut,
  Plus, Trash2, Link as LinkIcon, CheckCircle, Shield,
  AlertTriangle, Mail, Smartphone, RefreshCw, Eye, EyeOff,
  Tag, Monitor, LayoutDashboard, Sparkles, BarChart, TrendingUp, Calendar,
  Award, GraduationCap, Trophy
} from 'lucide-react';
import { CoachDogFullLogo } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { ViewModeToggle } from '../components/common/ViewModeToggle';
import { TrialCountdownBanner } from '../components/subscription/TrialCountdownBanner';
import { CancelSubscriptionModal } from '../components/subscription/CancelSubscriptionModal';
import { ProfileViewsChart } from '../components/analytics/ProfileViewsChart';

const AVAILABLE_SPECIALTIES: Specialty[] = [
  'Career Growth', 
  'Stress Relief', 
  'Relationships', 
  'Health & Wellness', 
  'Executive Coaching'
];

const AVAILABLE_FORMATS: Format[] = ['Online', 'In-Person', 'Hybrid'];

export const CoachDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { coach: currentCoach, logout, loading: authLoading, refreshCoach } = useAuth();
  const { viewMode, setViewMode, isMobile, isTablet } = useDeviceDetection();
  const hasRedirected = useRef(false);

  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'subscription' | 'analytics'>('profile');

  // Local form state for profile editing (prevents auto-save on every keystroke)
  const [localProfile, setLocalProfile] = useState<Partial<Coach> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<CoachAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Initialize local profile state when coach data loads
  useEffect(() => {
    if (currentCoach && !localProfile) {
      setLocalProfile({
        name: currentCoach.name,
        bio: currentCoach.bio,
        hourlyRate: currentCoach.hourlyRate,
        specialties: currentCoach.specialties || [],
        availableFormats: currentCoach.availableFormats || [],
        socialLinks: currentCoach.socialLinks || []
      });
    }
  }, [currentCoach, localProfile]);

  // New Link State
  const [newLink, setNewLink] = useState({ platform: '', url: '' });
  const [newQualification, setNewQualification] = useState<{ degree: string; institution?: string; year?: number }>({ degree: '', institution: '', year: undefined });
  const [newAcknowledgement, setNewAcknowledgement] = useState<{ title: string; icon?: string; year?: number }>({ title: '', icon: '', year: undefined });

  // 2FA Setup State
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  // Password Change State
  const [passState, setPassState] = useState({ current: '', new: '', confirm: '' });
  const [showPassState, setShowPassState] = useState({ current: false, new: false, confirm: false });

  // Cancel Subscription Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log('[CoachDashboard] Auth state:', { authLoading, hasCoach: !!currentCoach, hasRedirected: hasRedirected.current });

    // CRITICAL FIX: Only redirect if authLoading is false AND we've waited at least 3 seconds
    // This prevents redirect loops when profile fetch is slow or fails
    if (!authLoading && !currentCoach && !hasRedirected.current) {
      // Add a delay to give profile fetch time to complete
      const timeoutId = setTimeout(() => {
        if (!currentCoach) {
          console.log('[CoachDashboard] Not authenticated after delay, redirecting to login');
          hasRedirected.current = true;
          navigate('/coach-login', { state: { from: location } });
        }
      }, 2000); // Wait 2 seconds before redirecting

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, currentCoach]);

  // Check for pending checkout after login
  useEffect(() => {
    if (currentCoach && !authLoading) {
      const pendingCheckout = sessionStorage.getItem('pendingCheckout');

      if (pendingCheckout) {
        try {
          const { plan, timestamp } = JSON.parse(pendingCheckout);

          // Expire after 30 minutes
          const thirtyMinutes = 30 * 60 * 1000;
          if (Date.now() - timestamp < thirtyMinutes) {
            console.log('[CoachDashboard] Redirecting to pending checkout:', plan);
            sessionStorage.removeItem('pendingCheckout');
            navigate(`/checkout/${plan}`, { replace: true });
          } else {
            sessionStorage.removeItem('pendingCheckout');
          }
        } catch (err) {
          console.error('[CoachDashboard] Error parsing pending checkout:', err);
          sessionStorage.removeItem('pendingCheckout');
        }
      }
    }
  }, [currentCoach, authLoading, navigate]);

  // Load analytics when analytics tab is selected
  useEffect(() => {
    if (activeTab === 'analytics' && currentCoach && !analytics) {
      const loadAnalytics = async () => {
        setLoadingAnalytics(true);
        const data = await getCoachAnalytics(currentCoach.id);
        setAnalytics(data);
        setLoadingAnalytics(false);
      };
      loadAnalytics();
    }
  }, [activeTab, currentCoach, analytics]);

  const handleLogout = async () => {
    await logout();
    navigate('/coach-login');
  };

  // Update local profile state (doesn't save to database)
  const updateLocalProfile = (updates: Partial<Coach>) => {
    setLocalProfile(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  // Save changes to database (only called when user clicks "Save Changes")
  const handleSaveProfile = async () => {
    if (!currentCoach || !localProfile) return;

    setIsSaving(true);
    const updated = { ...currentCoach, ...localProfile };

    const success = await updateCoach(updated);
    if (success) {
      await refreshCoach(); // Refresh auth context with updated data
      setHasUnsavedChanges(false);
      alert('✓ Profile updated successfully!');
    } else {
      alert('⚠ Failed to save changes. Please try again.');
    }
    setIsSaving(false);
  };

  // For subscription/account changes that still need immediate saves
  const handleUpdateCoach = async (updates: Partial<Coach>) => {
    if (!currentCoach) return;
    const updated = { ...currentCoach, ...updates };

    const success = await updateCoach(updated);
    if (success) {
      await refreshCoach(); // Refresh auth context with updated data
      alert('✓ Profile updated successfully!');
    } else {
      alert('⚠ Failed to save changes. Please try again.');
    }
  };

  // Cancel subscription handler
  const handleCancelSubscription = async (reason: string, feedback: string, dataPreference: 'keep' | 'delete') => {
    if (!currentCoach) return;

    // Prevent duplicate cancellations
    if (currentCoach.cancelledAt) {
      alert('This subscription has already been cancelled.');
      setIsCancelModalOpen(false);
      return;
    }

    // Calculate subscription end date (30 days from now for monthly, 365 days for annual)
    const now = new Date();
    const daysToAdd = currentCoach.billingCycle === 'annual' ? 365 : 30;
    const subscriptionEndsAt = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // Calculate scheduled deletion date based on preference
    let scheduledDeletionAt: string | undefined;
    if (dataPreference === 'delete') {
      // Delete within 30 days after subscription ends
      const deletionDate = new Date(subscriptionEndsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      scheduledDeletionAt = deletionDate.toISOString();
    } else {
      // Keep for 2 years after subscription ends
      const deletionDate = new Date(subscriptionEndsAt.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);
      scheduledDeletionAt = deletionDate.toISOString();
    }

    const updates = {
      cancelledAt: now.toISOString(),
      subscriptionEndsAt: subscriptionEndsAt.toISOString(),
      cancelReason: reason,
      cancelFeedback: feedback || undefined,
      dataRetentionPreference: dataPreference,
      scheduledDeletionAt
    };

    const success = await updateCoach({ ...currentCoach, ...updates });
    if (success) {
      await refreshCoach();
      setIsCancelModalOpen(false);
    } else {
      throw new Error('Failed to cancel subscription');
    }
  };

  // Reactivate subscription handler
  const handleReactivateSubscription = async () => {
    if (!currentCoach) return;

    const updates = {
      cancelledAt: null,
      subscriptionEndsAt: null,
      cancelReason: null,
      cancelFeedback: null,
      dataRetentionPreference: null,
      scheduledDeletionAt: null
    };

    const success = await updateCoach({ ...currentCoach, ...updates });
    if (success) {
      await refreshCoach();
      alert('✓ Subscription reactivated successfully!');
    } else {
      alert('⚠ Failed to reactivate subscription. Please try again.');
    }
  };

  // --- Profile Helpers (use local state, not immediate saves) ---
  const addLink = () => {
    if (newLink.platform && newLink.url) {
      const updatedLinks = [...(localProfile?.socialLinks || []), newLink];
      updateLocalProfile({ socialLinks: updatedLinks });
      setNewLink({ platform: '', url: '' });
    }
  };

  const removeLink = (index: number) => {
    const updatedLinks = [...(localProfile?.socialLinks || [])];
    updatedLinks.splice(index, 1);
    updateLocalProfile({ socialLinks: updatedLinks });
  };

  const toggleSpecialty = (s: Specialty) => {
    if (!localProfile) return;
    const current = localProfile.specialties || [];
    const updated = current.includes(s)
        ? current.filter(item => item !== s)
        : [...current, s];
    updateLocalProfile({ specialties: updated });
  };

  const toggleFormat = (f: Format) => {
    if (!localProfile) return;
    const current = localProfile.availableFormats || [];
    const updated = current.includes(f)
        ? current.filter(item => item !== f)
        : [...current, f];
    updateLocalProfile({ availableFormats: updated });
  };

  const handleForgotPassword = () => {
      alert(`Password reset link sent to ${currentCoach?.email}`);
  };

  const handleEnable2FA = () => {
      if(twoFACode === '123456') {
          handleUpdateCoach({ twoFactorEnabled: true });
          setIsSettingUp2FA(false);
          setTwoFACode('');
      } else {
          alert("Invalid code. Try 123456");
      }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Not authenticated - redirect handled by useEffect
  if (!currentCoach) {
    return null;
  }

  // ---------------- EXPIRED ----------------
  if (currentCoach.subscriptionStatus === 'expired') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
         <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-10 text-center border border-slate-100">
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="h-10 w-10 text-red-500" />
             </div>
             <h2 className="text-3xl font-display font-bold text-slate-900 mb-3">Trial Expired</h2>
             <p className="text-slate-500 mb-8">Your dashboard is locked. Choose a plan to continue managing your profile.</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Link
                  to="/checkout/monthly"
                  className="bg-slate-100 border-2 border-transparent hover:border-slate-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all block"
                >
                  <span className="block font-bold text-slate-900 text-xl">Monthly</span>
                  <span className="block text-slate-500">£15/mo</span>
                </Link>
                <Link
                  to="/checkout/annual"
                  className="bg-slate-900 border-2 border-slate-900 p-5 rounded-2xl relative shadow-lg hover:-translate-y-1 transition-all block text-white"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-sm">SAVE 17%</div>
                  <span className="block font-bold text-xl">Annual</span>
                  <span className="block text-slate-300">£150/yr</span>
                </Link>
             </div>
             <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600 font-medium text-sm">Log Out</button>
         </div>
      </div>
    );
  }

  // ---------------- MAIN DASHBOARD ----------------
  // Determine if we should show sidebar or mobile tabs based on view mode
  const showSidebar = viewMode === 'desktop' || (!isMobile && !isTablet);
  const showMobileTabs = viewMode === 'mobile' || isMobile;

  return (
    <div className="bg-slate-50 min-h-screen">

      {/* Dashboard Banner Gradient */}
      <div className="bg-gradient-to-r from-teal-600 to-indigo-700 h-48 w-full absolute top-20 left-0 z-0"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12">

        {/* View Mode Toggle - Show on tablet and desktop */}
        {!isMobile && (
          <div className="flex justify-end mb-4">
            <ViewModeToggle viewMode={viewMode} onToggle={setViewMode} />
          </div>
        )}

        {/* Mobile Tab Bar - Show only in mobile view */}
        {showMobileTabs && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 mb-6 overflow-x-auto">
            <div className="flex space-x-2 min-w-max">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === 'profile'
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === 'subscription'
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="h-4 w-4 inline mr-2" />
                Subscription
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-green-50 text-green-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <BarChart className="h-4 w-4 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === 'account'
                    ? 'bg-slate-100 text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Account
              </button>
            </div>
          </div>
        )}

        <div className={`flex flex-col ${showSidebar ? 'md:flex-row' : ''} md:items-start gap-8`}>

          {/* Sidebar - Show only in desktop view */}
          {showSidebar && (
          <div className="md:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden sticky top-24">
              
              {/* Profile Card Header */}
              <div className="p-8 pb-6 text-center bg-slate-50/50">
                <div className="relative inline-block">
                  <img 
                    src={currentCoach.photoUrl || 'https://picsum.photos/200/200'} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-2xl mx-auto object-cover border-4 border-white shadow-md" 
                  />
                  {currentCoach.subscriptionStatus === 'trial' && (
                    <span className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">TRIAL</span>
                  )}
                </div>
                <h2 className="font-display font-bold text-xl text-slate-900 mt-4">{currentCoach.name}</h2>
                <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mt-1">Verified Coach</p>
              </div>

              {/* Navigation Tabs */}
              <nav className="p-3 space-y-1">
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'profile' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <User className={`h-5 w-5 mr-3 ${activeTab === 'profile' ? 'text-brand-600' : 'text-slate-400'}`} /> Edit Profile
                </button>
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'subscription' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <CreditCard className={`h-5 w-5 mr-3 ${activeTab === 'subscription' ? 'text-indigo-600' : 'text-slate-400'}`} /> Subscription
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <BarChart className={`h-5 w-5 mr-3 ${activeTab === 'analytics' ? 'text-green-600' : 'text-slate-400'}`} /> Analytics
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'account' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <Settings className={`h-5 w-5 mr-3 ${activeTab === 'account' ? 'text-slate-700' : 'text-slate-400'}`} /> Account
                </button>
              </nav>

              <div className="p-3 border-t border-slate-100 mt-2">
                 <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                   <LogOut className="h-5 w-5 mr-3" /> Sign Out
                 </button>
              </div>
            </div>
          </div>
          )}

          {/* Content Area */}
          <div className="flex-grow space-y-6">

            {/* Trial Countdown Banner */}
            {currentCoach && <TrialCountdownBanner coach={currentCoach} />}

            {/* ---------------- PROFILE TAB ---------------- */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 space-y-8 animate-fade-in-up">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                    <div className="flex items-center">
                        <div className="bg-brand-100 p-2 rounded-lg mr-4 text-brand-600">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-slate-900">Public Profile</h2>
                            <p className="text-slate-500 text-sm">Update how clients see you.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasUnsavedChanges && (
                        <span className="text-xs font-bold text-amber-600 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" /> Unsaved changes
                        </span>
                      )}
                      <button
                        onClick={() => navigate(`/coach/${currentCoach?.id}`)}
                        className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Profile
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={!hasUnsavedChanges || isSaving}
                        className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={localProfile?.name || ''}
                          onChange={(e) => updateLocalProfile({name: e.target.value})}
                          className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                        />
                    </div>
                  </div>

                  {/* Matching Criteria Section */}
                  <div className="bg-gradient-to-br from-brand-50 to-indigo-50 rounded-2xl p-6 border border-brand-100 space-y-6">
                      <h3 className="text-sm font-extrabold text-brand-900 flex items-center uppercase tracking-widest">
                        <Sparkles className="h-4 w-4 mr-2" /> Matching Criteria
                      </h3>
                      
                      {/* Specialties Tags */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                           <Tag className="h-4 w-4 mr-2 text-slate-400" /> Specializations
                        </label>
                        <div className="flex flex-wrap gap-2">
                           {AVAILABLE_SPECIALTIES.map(s => (
                             <button
                               key={s}
                               onClick={() => toggleSpecialty(s)}
                               className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all duration-200 ${
                                 localProfile?.specialties?.includes(s)
                                 ? 'bg-brand-600 text-white border-brand-600 shadow-md transform scale-105'
                                 : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                               }`}
                             >
                               {s}
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Format Checkboxes */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                                <Monitor className="h-4 w-4 mr-2 text-slate-400" /> Coaching Formats
                            </label>
                            <div className="space-y-2">
                                {AVAILABLE_FORMATS.map(f => (
                                <label key={f} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-white/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={localProfile?.availableFormats?.includes(f)}
                                        onChange={() => toggleFormat(f)}
                                        className="h-5 w-5 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-3 text-sm font-medium text-slate-800">{f}</span>
                                </label>
                                ))}
                            </div>
                          </div>

                          {/* Hourly Rate */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Hourly Rate ($)</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold">$</span>
                                <input
                                    type="number"
                                    value={localProfile?.hourlyRate || 0}
                                    onChange={(e) => updateLocalProfile({hourlyRate: parseInt(e.target.value) || 0})}
                                    className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold text-slate-800"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Used to match with client budget ranges.</p>
                          </div>
                      </div>
                  </div>
                  
                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Bio</label>
                    <textarea rows={4} value={localProfile?.bio || ''} onChange={(e) => updateLocalProfile({bio: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors" />
                  </div>

                  {/* Professional Credentials Section */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 space-y-6">
                      <h3 className="text-sm font-extrabold text-indigo-900 flex items-center uppercase tracking-widest">
                        <Award className="h-4 w-4 mr-2" /> Professional Credentials
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Accreditation Level */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Accreditation Level</label>
                            <select
                              value={localProfile?.accreditationLevel || ''}
                              onChange={(e) => updateLocalProfile({accreditationLevel: e.target.value as any})}
                              className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800"
                            >
                              <option value="">Select accreditation...</option>
                              <option value="Foundation">Foundation</option>
                              <option value="Practitioner">Practitioner</option>
                              <option value="Senior Practitioner">Senior Practitioner</option>
                              <option value="Master Practitioner">Master Practitioner</option>
                              <option value="Certified">Certified</option>
                              <option value="Advanced Certified">Advanced Certified</option>
                            </select>
                          </div>

                          {/* Coaching Hours */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Coaching Hours</label>
                            <input
                              type="number"
                              value={localProfile?.coachingHours || ''}
                              onChange={(e) => updateLocalProfile({coachingHours: parseInt(e.target.value) || 0})}
                              placeholder="e.g., 500"
                              className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800"
                            />
                            <p className="text-xs text-slate-500 mt-2">Total hours of coaching experience</p>
                          </div>
                      </div>

                      {/* Additional Certifications */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Additional Certifications</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {['Mental Health First Aid Trained', 'Trauma Informed', 'Diversity & Inclusion Certified', 'Child & Adolescent Specialist', 'Corporate Coaching Certified', 'NLP Practitioner', 'CBT Trained'].map(cert => (
                            <label key={cert} className="flex items-center cursor-pointer p-3 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 transition-colors">
                              <input
                                type="checkbox"
                                checked={localProfile?.additionalCertifications?.includes(cert as any) || false}
                                onChange={(e) => {
                                  const current = localProfile?.additionalCertifications || [];
                                  const updated = e.target.checked
                                    ? [...current, cert as any]
                                    : current.filter(c => c !== cert);
                                  updateLocalProfile({additionalCertifications: updated});
                                }}
                                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                              />
                              <span className="ml-3 text-xs font-medium text-slate-700">{cert}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Location Radius */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Location Radius (for in-person coaching)</label>
                        <input
                          type="text"
                          value={localProfile?.locationRadius || ''}
                          onChange={(e) => updateLocalProfile({locationRadius: e.target.value})}
                          placeholder="e.g., within 5 miles of London"
                          className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800"
                        />
                      </div>

                      {/* Languages */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Languages</label>
                        <input
                          type="text"
                          value={localProfile?.languages?.join(', ') || ''}
                          onChange={(e) => updateLocalProfile({languages: e.target.value.split(',').map(l => l.trim()).filter(Boolean)})}
                          placeholder="e.g., English, Spanish, French"
                          className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800"
                        />
                        <p className="text-xs text-slate-500 mt-2">Separate multiple languages with commas</p>
                      </div>
                  </div>

                  {/* Qualifications Section */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <div className="bg-slate-100 p-1.5 rounded mr-2 text-slate-600"><GraduationCap className="h-4 w-4" /></div> Qualifications
                    </h3>
                    <div className="space-y-3 mb-4">
                        {localProfile?.qualifications?.map((qual, idx) => (
                            <div key={idx} className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex-grow">
                                    <p className="text-sm font-bold text-slate-900">{qual.degree}</p>
                                    {qual.institution && <p className="text-xs text-slate-600 mt-1">{qual.institution}</p>}
                                    {qual.year && <p className="text-xs text-slate-500 mt-1">{qual.year}</p>}
                                </div>
                                <button
                                  onClick={() => {
                                    const updated = (localProfile?.qualifications || []).filter((_, i) => i !== idx);
                                    updateLocalProfile({qualifications: updated});
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200">
                        <input
                            type="text"
                            placeholder="Degree (e.g., Masters in Law)"
                            className="border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newQualification.degree}
                            onChange={(e) => setNewQualification({...newQualification, degree: e.target.value})}
                        />
                        <input
                            type="text"
                            placeholder="Institution (optional)"
                            className="border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newQualification.institution}
                            onChange={(e) => setNewQualification({...newQualification, institution: e.target.value})}
                        />
                        <input
                            type="number"
                            placeholder="Year (optional)"
                            className="border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newQualification.year || ''}
                            onChange={(e) => setNewQualification({...newQualification, year: parseInt(e.target.value) || undefined})}
                        />
                        <button
                            onClick={() => {
                              if (newQualification.degree) {
                                const updated = [...(localProfile?.qualifications || []), {
                                  id: `qual_${Date.now()}`,
                                  degree: newQualification.degree,
                                  institution: newQualification.institution,
                                  year: newQualification.year
                                }];
                                updateLocalProfile({qualifications: updated});
                                setNewQualification({degree: '', institution: '', year: undefined});
                              }
                            }}
                            disabled={!newQualification.degree}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center shadow-md"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add Qualification
                        </button>
                    </div>
                  </div>

                  {/* Acknowledgements Section */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <div className="bg-slate-100 p-1.5 rounded mr-2 text-slate-600"><Trophy className="h-4 w-4" /></div> Acknowledgements & Awards
                    </h3>
                    <div className="space-y-3 mb-4">
                        {localProfile?.acknowledgements?.map((ack, idx) => (
                            <div key={idx} className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex-grow">
                                    <p className="text-sm font-bold text-slate-900">{ack.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {ack.icon && <span className="text-xs text-slate-500">Icon: {ack.icon}</span>}
                                      {ack.year && <span className="text-xs text-slate-500">{ack.year}</span>}
                                    </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const updated = (localProfile?.acknowledgements || []).filter((_, i) => i !== idx);
                                    updateLocalProfile({acknowledgements: updated});
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200">
                        <input
                            type="text"
                            placeholder="Title (e.g., Coach of the Year 2025)"
                            className="border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newAcknowledgement.title}
                            onChange={(e) => setNewAcknowledgement({...newAcknowledgement, title: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                              type="text"
                              placeholder="Icon (e.g., star, trophy)"
                              className="border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                              value={newAcknowledgement.icon || ''}
                              onChange={(e) => setNewAcknowledgement({...newAcknowledgement, icon: e.target.value})}
                          />
                          <input
                              type="number"
                              placeholder="Year (optional)"
                              className="border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                              value={newAcknowledgement.year || ''}
                              onChange={(e) => setNewAcknowledgement({...newAcknowledgement, year: parseInt(e.target.value) || undefined})}
                          />
                        </div>
                        <button
                            onClick={() => {
                              if (newAcknowledgement.title) {
                                const updated = [...(localProfile?.acknowledgements || []), {
                                  id: `ack_${Date.now()}`,
                                  title: newAcknowledgement.title,
                                  icon: newAcknowledgement.icon,
                                  year: newAcknowledgement.year
                                }];
                                updateLocalProfile({acknowledgements: updated});
                                setNewAcknowledgement({title: '', icon: '', year: undefined});
                              }
                            }}
                            disabled={!newAcknowledgement.title}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center shadow-md"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add Acknowledgement
                        </button>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <div className="bg-slate-100 p-1.5 rounded mr-2 text-slate-600"><LinkIcon className="h-4 w-4" /></div> Social & Web Links
                    </h3>
                    <div className="space-y-3 mb-4">
                        {localProfile?.socialLinks?.map((link, idx) => (
                            <div key={idx} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex-grow">
                                    <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{link.platform}</p>
                                    <p className="text-sm text-brand-700 font-medium truncate">{link.url}</p>
                                </div>
                                <button onClick={() => removeLink(idx)} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                            type="text" 
                            placeholder="Label (e.g. LinkedIn)" 
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newLink.platform}
                            onChange={(e) => setNewLink({...newLink, platform: e.target.value})}
                        />
                         <input 
                            type="text" 
                            placeholder="URL (https://...)" 
                            className="flex-[2] border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newLink.url}
                            onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                        />
                        <button 
                            onClick={addLink}
                            disabled={!newLink.platform || !newLink.url}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center shadow-md"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add
                        </button>
                    </div>
                  </div>
              </div>
            )}

            {/* ---------------- SUBSCRIPTION TAB ---------------- */}
            {activeTab === 'subscription' && (
               <div className="space-y-6 animate-fade-in-up">
                   <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center">
                                <div className="bg-indigo-100 p-2 rounded-lg mr-4 text-indigo-600">
                                    <CreditCard className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-display font-bold text-slate-900">Subscription</h2>
                                    <p className="text-slate-500 text-sm">Plan and billing.</p>
                                </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                                (currentCoach.subscriptionStatus === 'active' || currentCoach.billingCycle) ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                                {(currentCoach.subscriptionStatus === 'active' || currentCoach.billingCycle) ? 'Premium' : 'Free Trial'}
                            </span>
                        </div>

                        {/* Show upgrade CTA only if no billing cycle is set (unpaid trial) */}
                        {currentCoach.subscriptionStatus === 'trial' && !currentCoach.billingCycle ? (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 text-center">
                                <h3 className="text-xl font-bold text-indigo-900 mb-3">Upgrade to Keep Access</h3>
                                <p className="text-sm text-indigo-700/80 mb-8 max-w-md mx-auto">
                                    Your trial ends on <span className="font-bold">{currentCoach.trialEndsAt ? new Date(currentCoach.trialEndsAt).toLocaleDateString() : 'soon'}</span>.
                                    Lock in your early bird rate now.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                                    <Link
                                        to="/checkout/monthly"
                                        className="bg-white border-2 border-transparent hover:border-indigo-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group block"
                                    >
                                        <span className="block font-bold text-slate-900 text-xl">Monthly</span>
                                        <span className="block text-slate-500">£15/mo</span>
                                    </Link>
                                    <Link
                                        to="/checkout/annual"
                                        className="bg-white border-2 border-brand-500 p-5 rounded-2xl relative shadow-lg hover:-translate-y-1 transition-all block"
                                    >
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-sm">SAVE 17%</div>
                                        <span className="block font-bold text-slate-900 text-xl">Annual</span>
                                        <span className="block text-slate-500">£150/yr</span>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Billing Cycle</h4>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-2xl font-bold text-slate-900 capitalize">{currentCoach.billingCycle || 'monthly'}</span>
                                                {/* Show pending change indicator */}
                                                {currentCoach.pendingPlanChange && (
                                                    <div className="mt-1 text-xs text-blue-600 font-bold">
                                                        → Changing to {currentCoach.pendingPlanChange.newBillingCycle}
                                                    </div>
                                                )}
                                            </div>
                                            {!currentCoach.pendingPlanChange && (
                                                <Link
                                                    to={`/subscription/change-plan?to=${(currentCoach.billingCycle || 'monthly') === 'monthly' ? 'annual' : 'monthly'}`}
                                                    className="text-sm text-brand-600 font-bold hover:underline flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:shadow transition-all"
                                                >
                                                    <RefreshCw className="h-3 w-3 mr-2" /> Change Plan
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Payment Method</h4>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-slate-600">
                                                Payment method managed securely by Stripe
                                            </p>
                                            <a
                                                href="https://dashboard.stripe.com"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-brand-600 font-bold hover:underline flex items-center"
                                            >
                                                Manage in Stripe
                                                <svg className="h-3 w-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-3">
                                            Your payment details are securely stored by Stripe. No card information is stored on our servers.
                                        </p>
                                    </div>
                                </div>

                                {/* Trial information for paid users */}
                                {currentCoach.subscriptionStatus === 'trial' && currentCoach.trialEndsAt && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <h4 className="text-sm font-bold text-blue-900 mb-2">Free Trial Active</h4>
                                                <p className="text-sm text-blue-800">
                                                    Your free trial continues until <span className="font-bold">{new Date(currentCoach.trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>.
                                                    After your trial ends, your {currentCoach.billingCycle} subscription will begin and you'll be charged automatically.
                                                </p>
                                                <p className="text-xs text-blue-700 mt-2">
                                                    You can cancel anytime before {new Date(currentCoach.trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} from the options below.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Pending Plan Change Banner (if plan change is scheduled) */}
                                {currentCoach.pendingPlanChange && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-blue-900 mb-2">
                                                    Plan Change Scheduled
                                                </h4>
                                                <p className="text-sm text-blue-800 mb-1">
                                                    Your plan will change from{' '}
                                                    <span className="font-bold capitalize">{currentCoach.billingCycle}</span> to{' '}
                                                    <span className="font-bold capitalize">{currentCoach.pendingPlanChange.newBillingCycle}</span> on{' '}
                                                    <span className="font-bold">
                                                        {new Date(currentCoach.pendingPlanChange.effectiveDate).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-blue-700">
                                                    You can cancel this change anytime before the effective date.
                                                </p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Are you sure you want to cancel this plan change?')) {
                                                        const success = await updateCoach({
                                                            ...currentCoach,
                                                            pendingPlanChange: null
                                                        });
                                                        if (success) {
                                                            await refreshCoach();
                                                            alert('✓ Plan change cancelled successfully!');
                                                        } else {
                                                            alert('⚠ Failed to cancel plan change. Please try again.');
                                                        }
                                                    }
                                                }}
                                                className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors flex-shrink-0"
                                            >
                                                Cancel Change
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Cancellation Banner (if subscription is cancelled) */}
                                {currentCoach.cancelledAt && currentCoach.subscriptionEndsAt && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-yellow-900 mb-2">
                                                    Subscription Scheduled for Cancellation
                                                </h4>
                                                <p className="text-sm text-yellow-800 mb-1">
                                                    Your subscription will end on{' '}
                                                    <span className="font-bold">
                                                        {new Date(currentCoach.subscriptionEndsAt).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-yellow-700">
                                                    You'll continue to have access until then. You can reactivate your subscription at any time.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleReactivateSubscription}
                                                className="ml-4 bg-yellow-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-yellow-700 transition-colors flex-shrink-0"
                                            >
                                                Reactivate
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Cancel Subscription Button (only show if not already cancelled) */}
                                {!currentCoach.cancelledAt && (
                                    <div className="mt-6 pt-6 border-t border-slate-200">
                                        <button
                                            onClick={() => setIsCancelModalOpen(true)}
                                            className="w-full bg-white border-2 border-red-200 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center"
                                        >
                                            <AlertTriangle className="h-5 w-5 mr-2" />
                                            Cancel Subscription
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                   </div>

                   {/* Cancel Subscription Modal */}
                   <CancelSubscriptionModal
                       coach={currentCoach}
                       isOpen={isCancelModalOpen}
                       onClose={() => setIsCancelModalOpen(false)}
                       onConfirm={handleCancelSubscription}
                   />
               </div>
            )}

            {/* ---------------- ANALYTICS TAB ---------------- */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fade-in-up">
                {loadingAnalytics ? (
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-brand-600" />
                    </div>
                  </div>
                ) : analytics ? (
                  <>
                    {/* Profile Views Chart with Time Period Selector */}
                    <ProfileViewsChart
                      viewsByDay={analytics.viewsByDay || []}
                      totalViews={analytics.totalViews}
                    />

                    {/* Top Referrers Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-slate-600" />
                        Top Traffic Sources
                      </h3>
                      {analytics.topReferrers && analytics.topReferrers.length > 0 ? (
                        <div className="space-y-2">
                          {analytics.topReferrers.map((ref, idx) => (
                            <div key={idx} className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <span className="text-sm text-slate-700 font-medium truncate max-w-xs">
                                {ref.referrer === 'direct' ? '🔗 Direct visits' : `🌐 ${ref.referrer}`}
                              </span>
                              <span className="font-bold text-slate-900">{ref.count} views</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm text-center py-8">No referrer data available yet</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
                    <p className="text-center text-slate-500 py-12">No analytics data available</p>
                  </div>
                )}
              </div>
            )}

            {/* ---------------- ACCOUNT TAB ---------------- */}
            {activeTab === 'account' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
                         <div className="flex items-center mb-8 border-b border-slate-100 pb-6">
                            <div className="bg-slate-100 p-2 rounded-lg mr-4 text-slate-600">
                                <Lock className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-bold text-slate-900">Login & Security</h2>
                                <p className="text-slate-500 text-sm">Protect your account.</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                <div className="flex gap-3">
                                    <input type="email" value={currentCoach.email || ''} disabled className="flex-grow border border-slate-200 bg-slate-50 text-slate-500 rounded-xl px-4 py-3" />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-8">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-bold text-slate-700">Password</label>
                                    <button onClick={handleForgotPassword} className="text-sm text-brand-600 font-medium hover:underline">Forgot Password?</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="relative">
                                      <input 
                                        type={showPassState.current ? "text" : "password"}
                                        placeholder="Current" 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm pr-10 outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white transition-colors" 
                                      />
                                    </div>
                                    <div className="relative">
                                      <input 
                                        type={showPassState.new ? "text" : "password"}
                                        placeholder="New" 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm pr-10 outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white transition-colors" 
                                      />
                                    </div>
                                    <button className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-800 shadow-md">Update Password</button>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-8">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 flex items-center">
                                            <Smartphone className="h-4 w-4 mr-2 text-slate-400" /> Two-Factor Authentication
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">Recommended for higher security.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if(currentCoach.twoFactorEnabled) {
                                                if(window.confirm('Disable 2FA?')) handleUpdateCoach({ twoFactorEnabled: false });
                                            } else {
                                                setIsSettingUp2FA(true);
                                            }
                                        }}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${currentCoach.twoFactorEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${currentCoach.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {isSettingUp2FA && (
                                    <div className="mt-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-fade-in">
                                        <p className="text-sm font-bold text-slate-800 mb-4">Scan with Authenticator App</p>
                                        <div className="flex flex-col sm:flex-row gap-6 items-center">
                                            <div className="h-32 w-32 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                                                 <div className="text-xs text-slate-300">QR CODE</div>
                                            </div>
                                            <div className="flex-grow space-y-3 w-full sm:w-auto">
                                                <input 
                                                    type="text" 
                                                    placeholder="Enter 6-digit code" 
                                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                                                    value={twoFACode}
                                                    onChange={(e) => setTwoFACode(e.target.value)}
                                                    maxLength={6}
                                                />
                                                <div className="flex gap-3">
                                                    <button onClick={handleEnable2FA} className="bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex-1 shadow-md hover:bg-green-700">Verify</button>
                                                    <button onClick={() => setIsSettingUp2FA(false)} className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-sm font-bold flex-1 hover:bg-slate-50">Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};