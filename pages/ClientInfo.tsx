
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HeartHandshake, Search, ArrowRight, Check } from 'lucide-react';

export const ClientInfo: React.FC = () => {
  return (
    <div className="flex flex-col bg-slate-50">
       {/* Hero - Consistent Light Theme with Blobs */}
       <div className="relative pt-24 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-widest mb-6">
            Trusted & Verified
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-slate-900 mb-6 tracking-tight">
            Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">CoachDog?</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            We exist to make finding a life coach safe, simple, and effective. No more guessing. Just verified results.
          </p>
          <Link to="/questionnaire" className="bg-slate-900 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 inline-flex items-center group">
            Find My Match <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Animated Blobs (Consistent with Home) */}
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 opacity-40 pointer-events-none">
             <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 rounded-full bg-brand-200 blur-3xl animate-blob"></div>
             <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 rounded-full bg-indigo-200 blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-rose-100 blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>
      </div>

      <div className="py-16 space-y-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Feature 1: Verification */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="inline-flex p-4 bg-white rounded-2xl shadow-md mb-2">
              <ShieldCheck className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-4xl font-display font-extrabold text-slate-900">Verification Matters.</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium max-w-2xl">
              The coaching industry is unregulated, meaning anyone can call themselves a coach. <span className="text-slate-900 font-bold">We change that.</span>
            </p>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
              We use official APIs to connect directly with global accreditation databases (ICF, EMCC, AC), ensuring every match is a verified professional.
            </p>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mt-4 inline-block">
                <ul className="space-y-3 text-left">
                    {['Identity Verification', 'Accreditation Check'].map(item => (
                    <li key={item} className="flex items-center text-slate-700 font-bold">
                        <div className="bg-green-100 rounded-full p-1 mr-3"><Check className="h-3 w-3 text-green-700" /></div>
                        {item}
                    </li>
                    ))}
                </ul>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 my-16"></div>

          {/* Feature 2: Matching */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="inline-flex p-4 bg-white rounded-2xl shadow-md mb-2">
              <HeartHandshake className="h-10 w-10 text-brand-500" />
            </div>
            <h2 className="text-4xl font-display font-extrabold text-slate-900">It's Not Just a Search. It's a Match.</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium max-w-2xl">
              Browsing hundreds of profiles is overwhelming. Our intelligent 4-step questionnaire analyzes your <span className="text-brand-600 font-bold">goals, budget, and learning style</span>.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
               We cut through the noise to recommend the top 3 coaches specifically for you, saving you hours of research.
            </p>
          </div>

          <div className="w-full h-px bg-slate-200 my-16"></div>

          {/* Feature 3: Pricing */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="inline-flex p-4 bg-white rounded-2xl shadow-md mb-2">
              <Search className="h-10 w-10 text-indigo-500" />
            </div>
            <h2 className="text-4xl font-display font-extrabold text-slate-900">Crystal Clear Pricing.</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium max-w-2xl">
              No hidden fees. No "Call for Quote" buttons.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
              View hourly rates upfront on every profile so you can find a coach that fits your financial comfort zone perfectly.
            </p>
          </div>

        </div>
      </div>
      
      {/* Bottom CTA */}
      <div className="bg-slate-900 py-24 text-center">
         <div className="max-w-3xl mx-auto px-4">
             <h2 className="text-4xl font-display font-bold text-white mb-6">Ready to find your path?</h2>
             <p className="text-slate-400 text-lg mb-10">Join thousands of others who found clarity and growth with CoachDog.</p>
             <Link to="/questionnaire" className="bg-brand-500 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-brand-600 transition-all shadow-lg hover:shadow-brand-500/50 inline-flex items-center">
                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
             </Link>
         </div>
      </div>
    </div>
  );
};
