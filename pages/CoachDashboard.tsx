import React, { useState, useEffect } from 'react';
import { getCoachById, updateCoach } from '../services/mockData';
import { Coach, Specialty, Format } from '../types';
import { User, Settings, FileText, Upload, Save, Lock, LayoutDashboard, LogOut } from 'lucide-react';

export const CoachDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // We will simulate logging in as "Dr. Sarah Jenkins" (id: c1)
  const [currentCoach, setCurrentCoach] = useState<Coach | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Load mock data for coach c1
      const coachData = getCoachById('c1');
      if (coachData) setCurrentCoach(coachData);
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login validation
    if (loginEmail && loginPass) {
      setIsAuthenticated(true);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCoach) {
      setIsSaving(true);
      updateCoach(currentCoach);
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  const updateField = (field: keyof Coach, value: any) => {
    if (currentCoach) {
      setCurrentCoach({ ...currentCoach, [field]: value });
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Coach Portal</h1>
            <p className="text-slate-500 mt-2">Manage your profile and client requests.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="coach@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 transition-colors shadow-md">
              Log In
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">Don't have an account? <span className="text-brand-600 font-semibold cursor-pointer">Apply to join</span></p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCoach) return <div>Loading...</div>;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          
          {/* Sidebar Navigation */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 text-center">
                <img src={currentCoach.photoUrl} alt="Profile" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-slate-100" />
                <h2 className="font-bold text-slate-900">{currentCoach.name}</h2>
                <p className="text-xs text-slate-500 truncate">{loginEmail || 'sarah@example.com'}</p>
              </div>
              <nav className="p-2 space-y-1">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <User className="h-4 w-4 mr-3" /> Edit Profile
                </button>
                <button 
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'account' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Settings className="h-4 w-4 mr-3" /> Account Settings
                </button>
              </nav>
              <div className="p-2 border-t border-slate-100 mt-2">
                 <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                   <LogOut className="h-4 w-4 mr-3" /> Sign Out
                 </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-grow">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center">
                      <LayoutDashboard className="h-5 w-5 mr-2 text-slate-400" /> 
                      Public Profile
                    </h2>
                    <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      Live on Directory
                    </span>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={currentCoach.name} 
                          onChange={(e) => updateField('name', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate ($)</label>
                         <input 
                          type="number" 
                          value={currentCoach.hourlyRate} 
                          onChange={(e) => updateField('hourlyRate', Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Professional Bio</label>
                      <textarea 
                        rows={4} 
                        value={currentCoach.bio}
                        onChange={(e) => updateField('bio', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                           <input 
                            type="text" 
                            value={currentCoach.location}
                            onChange={(e) => updateField('location', e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                           />
                        </div>
                         <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Years Experience</label>
                           <input 
                            type="number" 
                            value={currentCoach.yearsExperience}
                            onChange={(e) => updateField('yearsExperience', Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                           />
                        </div>
                    </div>
                    
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Photo URL</label>
                       <div className="flex gap-4 items-center">
                          <img src={currentCoach.photoUrl} alt="Preview" className="w-12 h-12 rounded bg-slate-100 object-cover" />
                          <input 
                             type="text" 
                             value={currentCoach.photoUrl}
                             onChange={(e) => updateField('photoUrl', e.target.value)}
                             className="flex-grow border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-600"
                          />
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                       <button 
                         type="submit" 
                         disabled={isSaving}
                         className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700 transition-colors flex items-center"
                       >
                         {isSaving ? 'Saving...' : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                       </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                   <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                     <FileText className="h-5 w-5 mr-2 text-slate-400" />
                     Verification & Evidence
                   </h3>
                   <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-8 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="p-3 bg-white rounded-full shadow-sm">
                           <Upload className="h-6 w-6 text-brand-500" />
                        </div>
                      </div>
                      <h4 className="text-slate-900 font-medium">Upload Certifications</h4>
                      <p className="text-slate-500 text-sm mt-1 mb-4">Upload PDF or JPG of your coaching certificates to get the Verified Badge.</p>
                      <button className="text-sm bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50">
                        Choose Files
                      </button>
                   </div>
                   <div className="mt-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Current Certifications Displayed:</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentCoach.certifications.map((c, i) => (
                          <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-sm border border-slate-200">{c}</span>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                   <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-slate-400" /> Account Management
                   </h2>
                   
                   <div className="space-y-6">
                      <div className="pb-6 border-b border-slate-100">
                         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Login Credentials</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                               <input type="email" value={loginEmail || 'sarah@example.com'} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed" />
                            </div>
                            <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                               <input type="password" value="********" disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed" />
                            </div>
                         </div>
                         <button className="mt-4 text-sm text-brand-600 font-medium hover:underline flex items-center">
                            <Lock className="h-3 w-3 mr-1" /> Reset Password
                         </button>
                      </div>

                      <div>
                         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Subscription Plan</h3>
                         <div className="bg-brand-50 border border-brand-100 rounded-lg p-4 flex justify-between items-center">
                            <div>
                               <p className="font-bold text-brand-900">Professional Plan</p>
                               <p className="text-xs text-brand-700 mt-1">Unlimited listings • 0% commission</p>
                            </div>
                            <span className="bg-white text-brand-600 text-xs font-bold px-3 py-1 rounded border border-brand-100">Active</span>
                         </div>
                         <div className="mt-4 text-right">
                            <button className="text-xs text-red-500 hover:text-red-700">Cancel Subscription</button>
                         </div>
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