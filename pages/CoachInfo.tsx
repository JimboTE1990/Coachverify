
import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Shield, ArrowRight, HeartHandshake, Check } from 'lucide-react';

export const CoachInfo: React.FC = () => {
  return (
    <div className="flex flex-col bg-slate-50">
      
      {/* Hero Section */}
      <div className="relative pt-24 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-6">
            For Professionals
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-slate-900 mb-6 tracking-tight">
            Grow Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-brand-500">Practice.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            Join a community of elite, verified professionals. We facilitate connections with clients who are looking for exactly what you offer.
          </p>
          <div className="flex justify-center gap-4">
             <Link to="/coach-signup" className="bg-slate-900 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 inline-flex items-center group">
               Apply to Join <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
             </Link>
             <Link to="/pricing" className="bg-white text-slate-700 border border-slate-200 px-10 py-5 rounded-full font-bold text-lg hover:bg-slate-50 transition-all inline-flex items-center">
               View Plans
             </Link>
          </div>
        </div>

        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 opacity-40 pointer-events-none">
             <div className="absolute top-0 left-1/4 -mt-20 w-96 h-96 rounded-full bg-indigo-200 blur-3xl animate-blob"></div>
             <div className="absolute bottom-0 right-1/4 -mb-20 w-80 h-80 rounded-full bg-brand-200 blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="group p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-brand-600" />
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">Instant Credibility</h3>
              <p className="text-slate-600 leading-relaxed">
                Our "Verified Coach" badge signifies you meet industry standards (ICF, EMCC, AC). We handle the vetting so you start with instant trust.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <HeartHandshake className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">Perfect Matches</h3>
              <p className="text-slate-600 leading-relaxed">
                We don't just send you traffic. We match you with clients whose goals align with your specific expertise, creating a win-win partnership.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart className="h-8 w-8 text-rose-500" />
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">Practice Tools</h3>
              <p className="text-slate-600 leading-relaxed">
                Streamline your administrative tasks. Manage your profile, view engagement analytics, and handle your subscription in one intuitive portal.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Feature List / CTA */}
      <div className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
                
                <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 relative z-10">Ready to make an impact?</h2>
                <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto relative z-10">
                    Start your 14-day free trial today. Join thousands of other coaches who found clarity and growth with CoachDog.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10">
                     <div className="flex items-center text-white/90 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                        <Check className="h-4 w-4 mr-2" /> No credit card required
                     </div>
                     <div className="flex items-center text-white/90 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                        <Check className="h-4 w-4 mr-2" /> Cancel anytime
                     </div>
                </div>

                <div className="mt-10 relative z-10">
                    <Link to="/coach-signup" className="bg-white text-brand-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-colors shadow-lg inline-flex items-center">
                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
