import React from 'react';
import { Link } from 'react-router-dom';
import { Search, HeartHandshake, Star, ArrowRight, ShieldCheck } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-brand-50 pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-4xl tracking-tight font-display font-extrabold text-slate-900 sm:text-5xl md:text-6xl">
            <span className="block xl:inline">Unlock your potential with</span>{' '}
            <span className="block text-brand-600 xl:inline">CoachDog.</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-slate-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Find the perfect life coach to help you achieve your goals. Verified experts, tailored matches, and real results.
          </p>
          
          <div className="mt-10 max-w-lg mx-auto grid gap-5 sm:grid-cols-2">
            <Link to="/questionnaire" className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl border-2 border-transparent hover:border-brand-500 transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-12 w-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900">Find Your Match</h3>
              <p className="text-sm text-slate-500 mt-2 text-center">Take a short quiz to get paired with your ideal coach.</p>
              <div className="mt-4 text-brand-600 font-semibold flex items-center text-sm">
                Start Questionnaire <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>

            <Link to="/search" className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl border-2 border-transparent hover:border-slate-300 transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-12 w-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900">Quick Search</h3>
              <p className="text-sm text-slate-500 mt-2 text-center">Browse our directory by name, specialty, or location.</p>
              <div className="mt-4 text-slate-700 font-semibold flex items-center text-sm">
                Browse Coaches <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>
        
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 opacity-30 pointer-events-none">
             <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-200 blur-3xl animate-blob"></div>
             <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-200 blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-trust-500 text-white mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Verified Professionals</h3>
              <p className="mt-2 text-base text-slate-500">Every coach is vetted for certifications and experience.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-500 text-white mb-4">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Real Reviews</h3>
              <p className="mt-2 text-base text-slate-500">Transparent feedback from verified clients.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mb-4">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Perfect Fit</h3>
              <p className="mt-2 text-base text-slate-500">Our matching algorithm finds the right style for you.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};