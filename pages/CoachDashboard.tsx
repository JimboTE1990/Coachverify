import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCoaches, updateCoach } from '../services/mockData';
import { Coach, SocialLink, Specialty, Format } from '../types';
import { 
  User, Settings, CreditCard, Lock, LogOut, Sparkles, 
  Plus, Trash2, Link as LinkIcon, CheckCircle, Shield, 
  AlertTriangle, Mail, Smartphone, RefreshCw, Eye, EyeOff,
  Tag, Monitor, LayoutDashboard
} from 'lucide-react';
import { DalmatianHeadLogo, CoachDogBrand } from '../components/Layout';

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
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'subscription'>('profile');
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // User Session
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null);

  // New Link State
  const [newLink, setNewLink] = useState({ platform: '', url: '' });

  // Payment Method Edit State
  const [isEditingPayment, setIsEditingPayment] = useState(false);

  // 2FA Setup State
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  // Password Change State
  const [passState, setPassState] = useState({ current: '', new: '', confirm: '' });
  const [showPassState, setShowPassState] = useState({ current: false, new: false, confirm: false });

  // Auto Login Check on Mount
  useEffect(() => {
    const state = location.state as any;
    if (state && state.autoLoginEmail) {
       setEmail(state.autoLoginEmail);
    }
  }, [location]);

  // Login Logic
  const handleLogin = (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
        try {
            const coaches = getCoaches();
            if (!coaches) throw new Error("Data unavailable");

            let found = coaches.find(c => c && c.email && c.email.toLowerCase() === email.toLowerCase());
            
            if (!found && email.toLowerCase().includes('sarah')) {
                found = coaches.find(c => c.id === 'c1');
            }

            if (found) {
                setCurrentCoach(found);
            } else {
                setError('Coach not found. Please check email or sign up.');
            }
        } catch (err) {
            setError('System error. Try resetting data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, 600);
  };

  const handleLogout = () => {
    setCurrentCoach(null);
    setEmail('');
    setPassword('');
    setError('');
    setShowLoginPassword(false);
  };

  const handleUpdateCoach = (updates: Partial<Coach>) => {
    if (!currentCoach) return;
    const updated = { ...currentCoach, ...updates };
    setCurrentCoach(updated); 
    updateCoach(updated); 
  };

  // --- Profile Helpers ---
  const addLink = () => {
    if (newLink.platform && newLink.url) {
      const updatedLinks = [...(currentCoach?.socialLinks || []), newLink];
      handleUpdateCoach({ socialLinks: updatedLinks });
      setNewLink({ platform: '', url: '' });
    }
  };

  const removeLink = (index: number) => {
    const updatedLinks = [...(currentCoach?.socialLinks || [])];
    updatedLinks.splice(index, 1);
    handleUpdateCoach({ socialLinks: updatedLinks });
  };

  const toggleSpecialty = (s: Specialty) => {
    if (!currentCoach) return;
    const current = currentCoach.specialties || [];
    const updated = current.includes(s) 
        ? current.filter(item => item !== s)
        : [...current, s];
    handleUpdateCoach({ specialties: updated });
  };

  const toggleFormat = (f: Format) => {
    if (!currentCoach) return;
    const current = currentCoach.availableFormats || [];
    const updated = current.includes(f) 
        ? current.filter(item => item !== f)
        : [...current, f];
    handleUpdateCoach({ availableFormats: updated });
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

  // ---------------- LOGIN SCREEN ----------------
  if (!currentCoach) {
      return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 px-4 py-12">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-500 to-indigo-600"></div>
            <div className="text-center mb-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-b from-indigo-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg p-2 transform rotate-3">
                  <DalmatianHeadLogo className="h-full w-full drop-shadow-md" />
              </div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Coach Portal</h1>
              <p className="text-slate-500 mt-2">Manage your practice in one place.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={showLoginPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none pr-10 transition-all"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl flex items-center border border-red-100">
                      <Lock className="h-4 w-4 mr-2" /> {error}
                  </div>
              )}

              <button 
                  type="submit" 
                  disabled={loading || !email}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? 'Accessing Portal...' : 'Enter Dashboard'}
              </button>
            </form>

            <div className="mt-4">
               <button
                 type="button"
                 onClick={() => { setEmail('sarah@example.com'); setPassword('demo123'); }}
                 className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-700 transition-colors"
               >
                 Auto-Fill Demo Credentials
               </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                  New to CoachDog? <Link to="/coach-signup" className="text-brand-600 font-bold hover:underline">Join the network</Link>
              </p>
            </div>
          </div>
        </div>
      );
  }

  // ---------------- ONBOARDING / EXPIRED ----------------
  if (currentCoach.subscriptionStatus === 'onboarding') {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
            <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-10 text-center border border-slate-100 animate-fade-in-up">
                <div className="w-24 h-24 bg-gradient-to-tr from-brand-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <Sparkles className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Welcome, {currentCoach.name?.split(' ')[0]}!</h1>
                <p className="text-slate-500 mb-10 text-lg">
                    Your account is fully verified. Unlock your dashboard with a free 14-day trial.
                </p>
                <button 
                    onClick={() => handleUpdateCoach({ subscriptionStatus: 'trial', trialEndsAt: new Date(Date.now() + 12096e5).toISOString() })}
                    className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 transition-all shadow-lg hover:shadow-brand-500/30"
                >
                    Activate Free Trial
                </button>
            </div>
        </div>
    );
  }

  if (currentCoach.subscriptionStatus === 'expired') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
         <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-10 text-center border border-slate-100">
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="h-10 w-10 text-red-500" />
             </div>
             <h2 className="text-3xl font-display font-bold text-slate-900 mb-3">Trial Expired</h2>
             <p className="text-slate-500 mb-8">Your dashboard is locked. Upgrade to continue managing your profile.</p>
             <button onClick={() => handleUpdateCoach({ subscriptionStatus: 'active', trialEndsAt: undefined })} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold mb-4 shadow-lg">
                 Upgrade Membership
             </button>
             <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600 font-medium text-sm">Log Out</button>
         </div>
      </div>
    );
  }

  // ---------------- MAIN DASHBOARD ----------------
  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* Dashboard Banner Gradient */}
      <div className="bg-gradient-to-r from-teal-600 to-indigo-700 h-48 w-full absolute top-20 left-0 z-0"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12">
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          
          {/* Sidebar */}
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

          {/* Content Area */}
          <div className="flex-grow space-y-6">
            
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
                    <button className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-700 hover:-translate-y-0.5 transition-all">Save Changes</button>
                  </div>
                  
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                        <input type="text" value={currentCoach.name || ''} onChange={(e) => handleUpdateCoach({name: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors" />
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
                                 currentCoach.specialties?.includes(s)
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
                                        checked={currentCoach.availableFormats?.includes(f)}
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
                                    value={currentCoach.hourlyRate || 0} 
                                    onChange={(e) => handleUpdateCoach({hourlyRate: parseInt(e.target.value) || 0})} 
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
                    <textarea rows={4} value={currentCoach.bio || ''} onChange={(e) => handleUpdateCoach({bio: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors" />
                  </div>

                  {/* Social Links */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <div className="bg-slate-100 p-1.5 rounded mr-2 text-slate-600"><LinkIcon className="h-4 w-4" /></div> Social & Web Links
                    </h3>
                    <div className="space-y-3 mb-4">
                        {currentCoach.socialLinks?.map((link, idx) => (
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
                                currentCoach.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                                {currentCoach.subscriptionStatus === 'active' ? 'Premium Active' : 'Free Trial'}
                            </span>
                        </div>

                        {currentCoach.subscriptionStatus === 'trial' ? (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 text-center">
                                <h3 className="text-xl font-bold text-indigo-900 mb-3">Upgrade to Keep Access</h3>
                                <p className="text-sm text-indigo-700/80 mb-8 max-w-md mx-auto">
                                    Your trial ends on <span className="font-bold">{currentCoach.trialEndsAt ? new Date(currentCoach.trialEndsAt).toLocaleDateString() : 'soon'}</span>. 
                                    Lock in your early bird rate now.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                                    <button 
                                        onClick={() => handleUpdateCoach({ subscriptionStatus: 'active', billingCycle: 'monthly', trialEndsAt: undefined })}
                                        className="bg-white border-2 border-transparent hover:border-indigo-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                                    >
                                        <span className="block font-bold text-slate-900 text-xl">Monthly</span>
                                        <span className="block text-slate-500">£15/mo</span>
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateCoach({ subscriptionStatus: 'active', billingCycle: 'annual', trialEndsAt: undefined })}
                                        className="bg-white border-2 border-brand-500 p-5 rounded-2xl relative shadow-lg transform hover:-translate-y-1 transition-all"
                                    >
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-sm">SAVE 17%</div>
                                        <span className="block font-bold text-slate-900 text-xl">Annual</span>
                                        <span className="block text-slate-500">£150/yr</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Billing Cycle</h4>
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-bold text-slate-900 capitalize">{currentCoach.billingCycle}</span>
                                            <button 
                                                onClick={() => {
                                                    const newCycle = currentCoach.billingCycle === 'monthly' ? 'annual' : 'monthly';
                                                    if(window.confirm(`Switch to ${newCycle} billing? Changes apply next cycle.`)) {
                                                        handleUpdateCoach({ billingCycle: newCycle });
                                                    }
                                                }}
                                                className="text-sm text-brand-600 font-bold hover:underline flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                                            >
                                                <RefreshCw className="h-3 w-3 mr-2" /> Switch
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Payment Method</h4>
                                        {!isEditingPayment ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-14 bg-white border border-slate-200 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                                        <span className="text-xs font-black text-slate-700 italic">VISA</span>
                                                    </div>
                                                    <span className="font-bold text-slate-800 text-lg">•••• 4242</span>
                                                </div>
                                                <button onClick={() => setIsEditingPayment(true)} className="text-sm text-brand-600 font-bold hover:underline">Update</button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <input type="text" placeholder="Card Number" className="w-full border p-2 rounded-lg text-sm" />
                                                <div className="flex gap-2">
                                                    <button onClick={() => setIsEditingPayment(false)} className="flex-1 bg-brand-600 text-white text-xs py-2 rounded-lg font-bold">Save</button>
                                                    <button onClick={() => setIsEditingPayment(false)} className="flex-1 bg-slate-200 text-slate-700 text-xs py-2 rounded-lg font-bold">Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                   </div>
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