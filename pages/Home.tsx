import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, HeartHandshake, Star, ArrowRight, ShieldCheck } from 'lucide-react';

export const Home: React.FC = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-brand-50 via-indigo-50 to-purple-50 pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">

          {/* Hero Image */}
          <div className="mb-8 flex justify-center">
            <img
              src="/home-hero.png"
              alt="CoachDog - Professional Coaching"
              className="max-w-lg w-full object-contain"
              style={{
                maxHeight: '450px',
                maskImage: 'radial-gradient(ellipse 80% 70% at center, black 40%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at center, black 40%, transparent 75%)'
              }}
            />
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-4xl tracking-tight font-display font-extrabold text-slate-900 sm:text-5xl md:text-6xl">
            <span className="block xl:inline">Top dog coaches,</span>{' '}
            <span className="block text-brand-600 xl:inline">no bones about it.</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-slate-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Sniffing out the best coaches in the business. Verified experts, tailored matches, and real results.
          </p>

          {/* CTAs */}
          <div className="mt-10 max-w-lg mx-auto grid gap-5 sm:grid-cols-2">
            <Link to="/questionnaire" className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl border-2 border-transparent hover:border-brand-500 transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-12 w-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900">Fetch Your Coach</h3>
              <p className="text-sm text-slate-500 mt-2 text-center">Take a short quiz to get paired with your ideal coach.</p>
              <div className="mt-4 text-brand-600 font-semibold flex items-center text-sm">
                Start Questionnaire <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>

            <Link to="/search" className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl border-2 border-transparent hover:border-slate-300 transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-12 w-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900">Do Some Digging</h3>
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

      {/* What is CoachDog Section with Video */}
      <div className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-extrabold text-slate-900 sm:text-4xl mb-4">
              What is CoachDog?
            </h2>
            <p className="text-lg text-slate-700 max-w-3xl mx-auto leading-relaxed mb-6">
              Historically, coach dogs ran alongside or under horse-drawn carriages to guard the horses and carriage from thieves or other animals. Now, CoachDog will run alongside you and your goals to guard you from fraudulent coaches and other scams.
            </p>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              CoachDog is the premier verified coaching platform, connecting you with accredited professionals who can help you achieve your personal and professional goals.
            </p>
          </div>

          {/* Embedded Video Player */}
          <div className="max-w-5xl mx-auto">
            <div
              onClick={handleVideoClick}
              className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-200 hover:border-brand-300 transition-all duration-300 cursor-pointer group"
            >
              <video
                ref={videoRef}
                src="/coachdog-intro.mp4"
                className="w-full aspect-video"
                controls
                playsInline
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">
              Click to play our introduction video
            </p>
          </div>
        </div>
      </div>

      {/* Why Use CoachDog Section (Anchor-able) */}
      <div id="why-use-coachdog" className="bg-slate-50 py-16 lg:py-24">
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
    </div>
  );
};
