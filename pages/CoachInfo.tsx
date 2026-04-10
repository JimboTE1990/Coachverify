
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, HeartHandshake, Check, Users, Star } from 'lucide-react';

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
      <div className="py-16 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div className="group p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-brand-600" />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-900 mb-3">Instant Credibility</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Our Verified Coach badge signals to clients that you meet recognised industry standards. We handle the vetting so you start with instant trust.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <HeartHandshake className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-900 mb-3">Professional Profile</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Your own coaching profile page with custom URL, photo, bio, credentials, and booking integration, optimised to convert visitors into clients.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Star className="h-8 w-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-900 mb-3">Real Client Reviews</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Collect and showcase authentic client reviews directly on your profile. Real testimonials build trust and drive new clients to choose you.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* What is Accreditation */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-widest mb-4">
              Understanding Accreditation
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">
              What is Coaching Accreditation?
            </h2>
          </div>
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
            <p className="text-slate-700 text-lg leading-relaxed mb-6">
              Coaching accreditation is a formal recognition awarded by professional coaching bodies that confirms a coach has met rigorous standards of training, experience, and ethical practice. It gives clients confidence that their coach is qualified, professional, and committed to their ongoing development.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed mb-6">
              Unlike many unregulated industries, accredited coaches have been assessed against internationally recognised competency frameworks. This means clients can find a coach with confidence, knowing they have been independently verified.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed">
              At CoachDog, we verify accreditation directly with the awarding bodies, so the badge you display on your profile is backed by real evidence, not just a self-declaration.
            </p>
          </div>
        </div>
      </div>

      {/* Accreditation Bodies */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-4">
              Recognised Bodies
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">
              Accreditation We Verify
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              CoachDog currently verifies credentials from the world's leading coaching accreditation bodies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            {/* EMCC */}
            <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <img src="/assets/emcc-logo.png" alt="EMCC Global logo" className="h-14 w-auto object-contain flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-display font-bold text-slate-900">EMCC Global</h3>
                  <p className="text-slate-500 text-sm">European Mentoring &amp; Coaching Council</p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                EMCC Global is one of the foremost professional bodies for coaching and mentoring worldwide. Their accreditation framework, the European Individual Accreditation (EIA), is recognised across more than 70 countries and assesses coaches against a rigorous competency model at four progressive levels.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  { label: 'Foundation', badge: '/assets/accreditation-badges/EMCC Accreditation - Foundation.png' },
                  { label: 'Practitioner', badge: '/assets/accreditation-badges/EMCC accreditation - Practitioner.jpg' },
                  { label: 'Senior Practitioner', badge: '/assets/accreditation-badges/EMCC Accreditation - Senior Practitioner.png' },
                  { label: 'Master Practitioner', badge: '/assets/accreditation-badges/EMCC Accreditation - Master Practitioner.png' },
                ].map(({ label, badge }) => (
                  <li key={label} className="flex items-center gap-3 text-slate-600 text-sm">
                    <img src={badge} alt={`EMCC ${label} badge`} className="h-8 w-8 object-contain flex-shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>
              <a
                href="https://www.emccglobal.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-800 transition-colors text-sm"
              >
                Learn more at EMCC Global <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </div>

            {/* ICF */}
            <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <img src="/assets/icf-logo.png" alt="ICF logo" className="h-14 w-auto object-contain flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-display font-bold text-slate-900">ICF</h3>
                  <p className="text-slate-500 text-sm">International Coaching Federation</p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                The International Coaching Federation is the world's largest coaching membership organisation, with over 50,000 members across 160 countries. ICF credentialling is widely regarded as the global benchmark for professional coaching standards.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  { label: 'ACC, Associate Certified Coach', badge: '/assets/accreditation-badges/ICF -ACC.png' },
                  { label: 'PCC, Professional Certified Coach', badge: '/assets/accreditation-badges/ICF - PCC.png' },
                  { label: 'MCC, Master Certified Coach', badge: '/assets/accreditation-badges/ICF -MCC.png' },
                ].map(({ label, badge }) => (
                  <li key={label} className="flex items-center gap-3 text-slate-600 text-sm">
                    <img src={badge} alt={`ICF ${label} badge`} className="h-8 w-8 object-contain flex-shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>
              <a
                href="https://coachingfederation.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-brand-600 font-semibold hover:text-brand-800 transition-colors text-sm"
              >
                Learn more at ICF <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </div>

            {/* AC */}
            <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <img src="/assets/ac-logo.png" alt="Association for Coaching logo" className="h-14 w-auto object-contain flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-display font-bold text-slate-900">AC</h3>
                  <p className="text-slate-500 text-sm">Association for Coaching</p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                The Association for Coaching is a leading independent and not-for-profit professional body dedicated to promoting best practice in coaching globally. AC accreditation is recognised as a mark of quality, ethics, and professional development.
              </p>
              <ul className="space-y-3 mb-6">
                {['Foundation', 'Practitioner', 'Senior Practitioner', 'Master Coach'].map(level => (
                  <li key={level} className="flex items-center gap-3 text-slate-600 text-sm">
                    <Check className="h-4 w-4 text-brand-500 flex-shrink-0" />
                    {level}
                  </li>
                ))}
              </ul>
              <a
                href="https://www.associationforcoaching.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-rose-600 font-semibold hover:text-rose-800 transition-colors text-sm"
              >
                Learn more at AC <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* Coaching Schools */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block py-1 px-3 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-widest mb-4">
              Coaching Schools
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">
              Where Coaches Train
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Great coaching starts with great training. We partner with coaching schools whose programmes are aligned with EMCC and ICF accreditation standards.
            </p>
          </div>

          {/* Coaching Minds Partnership Card */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                <div className="flex-shrink-0">
                  <img
                    src="/assets/cm-logo-3.png"
                    alt="Coaching Minds logo"
                    className="h-20 w-auto object-contain"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                    <Users className="h-3.5 w-3.5" />
                    Official Partner
                  </div>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mb-3">Coaching Minds</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    We're proud to be partnered with Coaching Minds Global, a leading coaching school delivering internationally recognised training programmes. Coaches who train with Coaching Minds are equipped to pursue EMCC and ICF accreditation, and we make it easy for them to showcase that on CoachDog.
                  </p>
                  <a
                    href="https://coachingmindsglobal.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Visit Coaching Minds <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            Are you a coaching school interested in partnering with CoachDog?{' '}
            <a href="mailto:support@coachdog.co.uk" className="text-brand-600 font-semibold hover:underline">
              Get in touch
            </a>
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>

            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 relative z-10">Ready to make an impact?</h2>
            <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto relative z-10">
              Start your free trial today. Join a growing community of accredited coaches building their practice with CoachDog.
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
