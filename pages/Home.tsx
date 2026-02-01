import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, HeartHandshake, Star, ArrowRight, ShieldCheck, Play, X } from 'lucide-react';

export const Home: React.FC = () => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <div className="flex flex-col">
      {/* Hero Section with Video */}
      <div className="relative bg-gradient-to-br from-brand-50 via-indigo-50 to-purple-50 pt-12 pb-16 lg:pt-16 lg:pb-20 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">

          {/* Video Section - Front and Center */}
          <div className="text-center mb-8">
            <div className="relative max-w-4xl mx-auto">
              {/* Video Thumbnail with Play Button */}
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="group relative w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white hover:border-brand-300 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-brand-500"
              >
                {/* Video Preview */}
                <video
                  src="/coachdog-intro.mp4"
                  className="w-full aspect-video object-cover"
                  muted
                  playsInline
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300"></div>

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-full p-6 shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                    <Play className="h-12 w-12 text-brand-600 fill-current" style={{ marginLeft: '4px' }} />
                  </div>
                </div>

                {/* Watch Text */}
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <span className="inline-block bg-white bg-opacity-90 text-slate-900 font-bold px-6 py-3 rounded-full shadow-lg">
                    ▶️ Watch Introduction Video
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* CTAs - Below Video */}
          <div className="max-w-lg mx-auto grid gap-5 sm:grid-cols-2 mb-10">
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

          {/* Title & Subtitle - Below CTAs */}
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-display font-extrabold text-slate-900 sm:text-5xl md:text-6xl">
              <span className="block xl:inline">Unlock your potential with</span>{' '}
              <span className="block text-brand-600 xl:inline">CoachDog.</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-slate-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Find the perfect life coach to help you achieve your goals. Verified experts, tailored matches, and real results.
            </p>
          </div>
        </div>

        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 opacity-20 pointer-events-none">
             <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-200 blur-3xl animate-blob"></div>
             <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-200 blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      {/* Why Use CoachDog Section (Anchor-able) */}
      <div id="why-use-coachdog" className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-extrabold text-slate-900 sm:text-4xl">
              Why Use CoachDog?
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              We make finding the right coach simple, trustworthy, and effective.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-br from-trust-50 to-green-50 border border-trust-100">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-trust-500 text-white mb-6 shadow-lg">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Professionals</h3>
              <p className="text-base text-slate-600 leading-relaxed">
                Every coach is vetted for certifications and experience. We verify EMCC and ICF credentials to ensure you're working with qualified professionals.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-500 text-white mb-6 shadow-lg">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Real Reviews</h3>
              <p className="text-base text-slate-600 leading-relaxed">
                Transparent feedback from verified clients. Read honest reviews and ratings to make informed decisions about your coaching journey.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-500 text-white mb-6 shadow-lg">
                <HeartHandshake className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Perfect Fit</h3>
              <p className="text-base text-slate-600 leading-relaxed">
                Our smart matching algorithm considers your goals, preferences, and coaching style to find coaches who truly align with your needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div className="relative w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-brand-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Video Player */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <video
                src="/coachdog-intro.mp4"
                controls
                autoPlay
                className="w-full"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
