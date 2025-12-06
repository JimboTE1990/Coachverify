import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCoachById } from '../services/mockData';
import { Coach } from '../types';
import { BadgeCheck, Star, MapPin, Clock, Award, ShieldCheck, ArrowLeft, Globe, Monitor, Instagram, Linkedin, Facebook, Twitter, ExternalLink } from 'lucide-react';

export const CoachDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [coach, setCoach] = useState<Coach | undefined>(undefined);

  useEffect(() => {
    if (id) {
      const found = getCoachById(id);
      setCoach(found);
    }
  }, [id]);

  if (!coach) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-700">Coach not found</h2>
        <Link to="/search" className="text-brand-600 hover:underline mt-4 inline-block">Back to Search</Link>
      </div>
    );
  }

  const avgRating = coach.reviews?.length 
    ? (coach.reviews.reduce((acc, r) => acc + r.rating, 0) / coach.reviews.length).toFixed(1)
    : 'New';

  // Helper to get icon for social link
  const getSocialIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return <Instagram className="h-5 w-5" />;
    if (p.includes('linkedin')) return <Linkedin className="h-5 w-5" />;
    if (p.includes('facebook')) return <Facebook className="h-5 w-5" />;
    if (p.includes('twitter') || p.includes('x')) return <Twitter className="h-5 w-5" />;
    if (p.includes('website')) return <Globe className="h-5 w-5" />;
    return <ExternalLink className="h-5 w-5" />;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Header / Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/search" className="text-slate-500 hover:text-brand-600 flex items-center text-sm font-medium">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Search
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Profile Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="relative flex-shrink-0">
                  <img 
                    src={coach.photoUrl} 
                    alt={coach.name} 
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl object-cover shadow-sm"
                  />
                  {coach.isVerified && (
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-trust-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-md whitespace-nowrap">
                      <BadgeCheck className="h-3 w-3 mr-1" /> Verified Coach
                    </div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900">{coach.name}</h1>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {coach.specialties?.map(s => (
                          <span key={s} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center bg-slate-50 px-3 py-1 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="ml-1.5 text-lg font-bold text-slate-900">{avgRating}</span>
                      <span className="ml-1 text-sm text-slate-500">({coach.reviews?.length || 0} reviews)</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-slate-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                      {coach.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-slate-400" />
                      {coach.yearsExperience} Years Exp.
                    </div>
                     <div className="flex items-center">
                      <Monitor className="h-4 w-4 mr-2 text-slate-400" />
                      {coach.availableFormats?.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">About Me</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{coach.bio}</p>
              
              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center">
                  <Award className="h-4 w-4 mr-2 text-brand-500" /> Credentials & Certifications
                </h3>
                <div className="flex flex-wrap gap-3">
                  {coach.certifications?.map((cert, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-sm text-slate-700 font-medium">
                      {cert}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Client Reviews</h2>
              {!coach.reviews || coach.reviews.length === 0 ? (
                <p className="text-slate-500 italic">No reviews yet.</p>
              ) : (
                <div className="space-y-6">
                  {coach.reviews.map(review => (
                    <div key={review.id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">{review.author}</span>
                        <span className="text-xs text-slate-400">{review.date}</span>
                      </div>
                      <div className="flex items-center mb-2">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-slate-200'}`} />
                         ))}
                      </div>
                      <p className="text-slate-600 text-sm">{review.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar / Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <div className="text-center border-b border-slate-100 pb-6 mb-6">
                <p className="text-sm text-slate-500 mb-1">Session Rate</p>
                <div className="flex items-center justify-center">
                  <span className="text-4xl font-bold text-slate-900">${coach.hourlyRate}</span>
                  <span className="text-slate-400 ml-1 self-end mb-1">/hour</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <button className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-sm hover:shadow-md">
                  Book a Session
                </button>

                {/* Dynamic Contact Links */}
                {coach.socialLinks && coach.socialLinks.length > 0 ? (
                  <div className="space-y-2 mt-4">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-2">Contact & Socials</p>
                     {coach.socialLinks.map((link, idx) => (
                       <a 
                         key={idx}
                         href={link.url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="w-full flex items-center justify-center space-x-2 bg-white text-slate-700 font-bold py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                       >
                         {getSocialIcon(link.platform)}
                         <span>{link.platform}</span>
                       </a>
                     ))}
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                     <p className="text-sm text-slate-500">Links available after booking.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-center text-xs text-slate-400">
                <ShieldCheck className="h-3 w-3 mr-1" />
                <span>Verified by CoachDog</span>
              </div>
            </div>
            
            <div className="bg-brand-50 rounded-xl p-6 border border-brand-100">
               <h3 className="font-bold text-brand-900 mb-2">Not sure yet?</h3>
               <p className="text-sm text-brand-800 mb-4">Compare {coach.name} with other top coaches in {coach.location}.</p>
               <Link to="/search" className="text-sm font-semibold text-brand-600 hover:text-brand-800 underline">Browse similar coaches</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};