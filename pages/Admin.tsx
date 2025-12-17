import React, { useState, useEffect } from 'react';
import { getCoaches, toggleVerifyCoach, toggleFlagReview } from '../services/supabaseService';
import { Coach } from '../types';
import { Lock, FileText, CheckCircle, XCircle, Flag, AlertTriangle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [coaches, setCoaches] = useState<Coach[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      const loadCoaches = async () => {
        const data = await getCoaches();
        setCoaches(data);
      };
      loadCoaches();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid password (hint: admin123)');
    }
  };

  const handleVerify = async (id: string) => {
    await toggleVerifyCoach(id);
    // Reload coaches after update
    const updated = await getCoaches();
    setCoaches(updated);
  };

  const handleFlag = async (coachId: string, reviewId: string) => {
    await toggleFlagReview(coachId, reviewId);
    // Reload coaches after update
    const updated = await getCoaches();
    setCoaches(updated);
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="bg-slate-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Admin Access</h2>
            <p className="text-slate-500">Please verify your credentials.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors">
              Enter Dashboard
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-400">Hint: admin123</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-600 hover:underline">Logout</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Queue */}
        <div className="lg:col-span-2 space-y-6">
           <h2 className="text-xl font-semibold text-slate-800 flex items-center">
             <FileText className="h-5 w-5 mr-2 text-brand-600" /> Coach Verification
           </h2>
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {coaches.map(coach => (
                <div key={coach.id} className="p-4 border-b border-slate-100 last:border-0 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center space-x-4">
                    <img src={coach.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-slate-900">{coach.name}</p>
                      <p className="text-xs text-slate-500">{coach.specialties.join(', ')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                     <div className="text-right mr-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${coach.documentsSubmitted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                           {coach.documentsSubmitted ? 'Docs Submitted' : 'Missing Docs'}
                        </span>
                     </div>
                     <button 
                       onClick={() => handleVerify(coach.id)}
                       className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                         coach.isVerified 
                         ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                         : 'bg-green-50 text-green-600 hover:bg-green-100'
                       }`}
                     >
                        {coach.isVerified ? (
                            <> <XCircle className="h-4 w-4 mr-1" /> Revoke </>
                        ) : (
                            <> <CheckCircle className="h-4 w-4 mr-1" /> Verify </>
                        )}
                     </button>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Review Management */}
        <div className="space-y-6">
           <h2 className="text-xl font-semibold text-slate-800 flex items-center">
             <Flag className="h-5 w-5 mr-2 text-yellow-600" /> Review Flags
           </h2>
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4 space-y-4">
              {coaches.flatMap(c => c.reviews.map(r => ({...r, coachName: c.name, coachId: c.id}))).filter(r => r.isFlagged).length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">No flagged reviews.</p>
              )}

              {coaches.flatMap(c => c.reviews.map(r => ({...r, coachName: c.name, coachId: c.id})))
                .filter(r => r.isFlagged)
                .map(review => (
                   <div key={review.id} className="bg-red-50 p-3 rounded-lg border border-red-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-red-800">Flagged: Fake/Abusive</span>
                        <button onClick={() => handleFlag(review.coachId, review.id)} className="text-xs text-slate-500 hover:text-slate-800 underline">Dismiss</button>
                      </div>
                      <p className="text-sm text-slate-800 italic">"{review.text}"</p>
                      <p className="text-xs text-slate-500 mt-2">— for {review.coachName}</p>
                   </div>
                ))
              }
           </div>
           
           <div className="bg-blue-50 p-4 rounded-xl">
               <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center"><AlertTriangle className="h-4 w-4 mr-2"/> System Status</h3>
               <p className="text-xs text-blue-800">Storage: LocalStorage Active</p>
               <p className="text-xs text-blue-800 mt-1">Backend: Mock Mode</p>
           </div>
        </div>
      </div>
    </div>
  );
};