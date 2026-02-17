import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, User, Search, HelpCircle, Mail, CreditCard, LogIn, UserPlus, LayoutDashboard, ClipboardList } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ProfileDropdown } from './navigation/ProfileDropdown';
import { ExpiredBanner } from './subscription/ExpiredBanner';
import { TrialCountdownBanner } from './subscription/TrialCountdownBanner';
import { TrialLoginNotification } from './subscription/TrialLoginNotification';
import { getStartingPrice } from '../config/pricing';

// --- Using actual logo image from PDF ---

const CoachDogFullLogo = ({ className = "h-12 w-auto" }: { className?: string }) => (
  <img
    src="/logo.png"
    alt="CoachDog"
    className={className}
  />
);

export { CoachDogFullLogo };

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, coach } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dropdown States
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Close dropdowns on click outside
  const navRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Helper for jazzy menu items
  const NavMenuItem = ({ to, icon: Icon, label, desc, colorClass = "text-brand-600 bg-brand-50" }: any) => (
    <Link 
      to={to} 
      className="group flex items-start p-4 rounded-2xl hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-100 hover:shadow-sm"
      onClick={() => setOpenDropdown(null)}
    >
      <div className={`flex-shrink-0 p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="ml-4">
        <p className="text-base font-display font-bold text-slate-800 group-hover:text-brand-700 transition-colors">{label}</p>
        {desc && <p className="text-sm text-slate-500 mt-1 font-medium">{desc}</p>}
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Expired Banner - shown globally at very top */}
      {coach && <ExpiredBanner coach={coach} />}

      {/* Trial Countdown Banner - shown globally for active trials */}
      {coach && <TrialCountdownBanner coach={coach} />}

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm transition-all duration-300" ref={navRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center group" onClick={closeMobileMenu}>
              <CoachDogFullLogo className="h-14 w-auto transition-opacity duration-200 group-hover:opacity-80" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">
              
              {/* Find a Coach Dropdown */}
              <div className="relative group">
                <button 
                  className={`flex items-center text-lg font-display font-bold transition-all focus:outline-none group ${openDropdown === 'client' ? 'text-brand-600' : 'text-slate-700 hover:text-brand-600'}`}
                  onClick={() => toggleDropdown('client')}
                >
                  Find a Coach 
                  <ChevronDown className={`ml-1.5 h-5 w-5 transition-transform duration-200 ${openDropdown === 'client' ? 'rotate-180 text-brand-600' : 'text-slate-400 group-hover:text-brand-600'}`} />
                </button>
                
                {openDropdown === 'client' && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-6 w-96 rounded-3xl shadow-2xl bg-white border border-slate-100 ring-1 ring-black ring-opacity-5 animate-fade-in-up overflow-hidden z-50">
                    <div className="h-1.5 bg-gradient-to-r from-brand-400 to-indigo-500"></div>
                    <div className="p-3 space-y-1">
                      <NavMenuItem 
                        to="/questionnaire" 
                        icon={ClipboardList} 
                        label="Find a Match" 
                        desc="Take the quiz to find your perfect fit"
                        colorClass="bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                      />
                      <NavMenuItem 
                        to="/search" 
                        icon={Search} 
                        label="Search Directory" 
                        desc="Browse all verified coaches" 
                      />
                      <a
                        href="/#why-use-coachdog"
                        className="group flex items-start p-4 rounded-2xl hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-100 hover:shadow-sm"
                        onClick={(e) => {
                          setOpenDropdown(null);
                          // If already on home page, smooth scroll
                          if (window.location.pathname === '/') {
                            e.preventDefault();
                            document.getElementById('why-use-coachdog')?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        <div className="flex-shrink-0 p-3 rounded-xl bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white group-hover:scale-110 transition-transform duration-200 shadow-sm">
                          <HelpCircle className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <p className="text-base font-display font-bold text-slate-800 group-hover:text-brand-700 transition-colors">Why Use Us?</p>
                          <p className="text-sm text-slate-500 mt-1 font-medium">Learn about our verification process</p>
                        </div>
                      </a>
                      <NavMenuItem 
                        to="/contact" 
                        icon={Mail} 
                        label="Contact Support" 
                        colorClass="bg-slate-50 text-slate-600 group-hover:bg-slate-600 group-hover:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* For Coaches Dropdown */}
              <div className="relative group">
                <button 
                  className={`flex items-center text-lg font-display font-bold transition-all focus:outline-none group ${openDropdown === 'coach' ? 'text-brand-600' : 'text-slate-700 hover:text-brand-600'}`}
                  onClick={() => toggleDropdown('coach')}
                >
                  For Coaches 
                  <ChevronDown className={`ml-1.5 h-5 w-5 transition-transform duration-200 ${openDropdown === 'coach' ? 'rotate-180 text-brand-600' : 'text-slate-400 group-hover:text-brand-600'}`} />
                </button>
                
                {openDropdown === 'coach' && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-6 w-96 rounded-3xl shadow-2xl bg-white border border-slate-100 ring-1 ring-black ring-opacity-5 animate-fade-in-up overflow-hidden z-50">
                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-rose-500"></div>
                    <div className="p-3 space-y-1">
                      <NavMenuItem 
                        to="/coach-benefits" 
                        icon={HelpCircle} 
                        label="Information" 
                        desc="Grow your practice with us"
                      />
                      <NavMenuItem
                        to="/pricing"
                        icon={CreditCard}
                        label="Pricing"
                        desc="Simple, transparent plans"
                        colorClass="bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white"
                      />
                      {/* Upgrade CTA for trial users */}
                      {isAuthenticated && coach && coach.subscriptionStatus === 'trial' && coach.subscriptionStatus !== 'lifetime' && (() => {
                        const startingPrice = getStartingPrice();
                        return (
                          <div className="mx-3 my-2">
                            <Link
                              to="/pricing"
                              className="block bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-2xl p-4 hover:from-brand-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-sm">🚀 Upgrade to Premium</p>
                                  <p className="text-xs text-brand-100 mt-1">From {startingPrice}/mo - Lock in your rate</p>
                                </div>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </div>
                            </Link>
                          </div>
                        );
                      })()}
                      <div className="border-t border-slate-100 my-2 mx-3"></div>
                      {!isAuthenticated && (
                        <>
                          <NavMenuItem
                            to="/coach-login"
                            icon={LayoutDashboard}
                            label="Coach Portal Log In"
                            colorClass="bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white"
                          />
                          <NavMenuItem
                            to="/coach-signup"
                            icon={UserPlus}
                            label="Join as a Coach"
                            colorClass="bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white"
                          />
                          <NavMenuItem
                            to="/check-email"
                            icon={Mail}
                            label="Resend Verification"
                            desc="Get a new verification link"
                            colorClass="bg-yellow-50 text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white"
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Upgrade to Premium Button - for trial users only, not lifetime */}
                {isAuthenticated && coach && coach.subscriptionStatus === 'trial' && (
                  <Link
                    to="/pricing"
                    className="relative flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-black hover:from-brand-700 hover:to-indigo-700 transition-all hover:-translate-y-0.5 border-2 border-orange-400/50"
                    style={{
                      boxShadow: '0 0 20px rgba(249, 115, 22, 0.4), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    {/* Realistic paw print icon */}
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      {/* Main pad (large bottom oval) */}
                      <ellipse cx="12" cy="17" rx="4.5" ry="3.5" />
                      {/* Top left toe pad */}
                      <ellipse cx="7" cy="9" rx="2" ry="2.5" transform="rotate(-15 7 9)" />
                      {/* Top middle-left toe pad */}
                      <ellipse cx="10" cy="7" rx="2" ry="2.5" transform="rotate(-5 10 7)" />
                      {/* Top middle-right toe pad */}
                      <ellipse cx="14" cy="7" rx="2" ry="2.5" transform="rotate(5 14 7)" />
                      {/* Top right toe pad */}
                      <ellipse cx="17" cy="9" rx="2" ry="2.5" transform="rotate(15 17 9)" />
                    </svg>
                    Upgrade to Premium
                  </Link>
                )}

                {/* Coach Login Button - for unauthenticated users */}
                {!isAuthenticated && (
                  <Link
                    to="/coach-login"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all border border-slate-200 shadow-sm"
                  >
                    <LogIn className="h-4 w-4" />
                    Coach Login
                  </Link>
                )}

                {/* Profile Dropdown or Get Matched Button */}
                {isAuthenticated ? (
                  <ProfileDropdown />
                ) : (
                  <Link to="/questionnaire" className="relative overflow-hidden group bg-brand-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-brand-500/30 hover:bg-brand-700 transition-all hover:-translate-y-0.5">
                    <span className="relative z-10 flex items-center text-base">Get Matched <ClipboardList className="ml-2 h-5 w-5" /></span>
                  </Link>
                )}
              </div>
            </nav>

            {/* Mobile Menu Button or Profile Dropdown */}
            <div className="md:hidden flex items-center space-x-2">
              {isAuthenticated && <ProfileDropdown />}
              <button
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-brand-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 h-[calc(100vh-5rem)] overflow-y-auto pb-20 animate-fade-in">
            <div className="px-4 pt-8 space-y-10">
              
              {/* Mobile Section: Clients */}
              <div>
                <h3 className="text-sm font-extrabold text-brand-600 uppercase tracking-widest mb-4 flex items-center"><User className="h-4 w-4 mr-2" /> Find a Coach</h3>
                <div className="space-y-3">
                   <Link to="/questionnaire" className="flex items-center px-5 py-4 rounded-2xl bg-brand-50 text-brand-700 font-bold border border-brand-100" onClick={closeMobileMenu}>
                      <ClipboardList className="h-6 w-6 mr-4" /> Find a Match
                   </Link>
                  <Link to="/search" className="flex items-center px-5 py-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold" onClick={closeMobileMenu}>
                      <Search className="h-6 w-6 mr-4 text-slate-400" /> Search Directory
                  </Link>
                  <Link to="/client-benefits" className="flex items-center px-5 py-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold" onClick={closeMobileMenu}>
                      <HelpCircle className="h-6 w-6 mr-4 text-slate-400" /> Why Use Us?
                  </Link>
                </div>
              </div>

              {/* Mobile Section: Coaches */}
              <div>
                <h3 className="text-sm font-extrabold text-indigo-600 uppercase tracking-widest mb-4 flex items-center"><LayoutDashboard className="h-4 w-4 mr-2" /> For Coaches</h3>
                <div className="space-y-3">
                  <Link to="/coach-login" className="flex items-center px-5 py-4 rounded-2xl bg-slate-50 text-slate-800 font-bold" onClick={closeMobileMenu}>
                      <LogIn className="h-6 w-6 mr-4" /> Portal Log In
                  </Link>
                  <Link to="/pricing" className="flex items-center px-5 py-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold" onClick={closeMobileMenu}>
                      <CreditCard className="h-6 w-6 mr-4 text-slate-400" /> Pricing
                  </Link>
                  <Link to="/coach-signup" className="flex items-center px-5 py-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold" onClick={closeMobileMenu}>
                      <UserPlus className="h-6 w-6 mr-4 text-slate-400" /> Sign Up
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
               <div className="mb-4">
                  <CoachDogFullLogo className="h-16 w-auto" />
               </div>
               <p className="text-slate-500 text-sm font-medium">A trusted verification platform for life coaches worldwide.</p>
            </div>
            
            <div>
               <h4 className="font-bold text-slate-900 mb-4">Clients</h4>
               <ul className="space-y-2 text-sm text-slate-500 font-medium">
                 <li><Link to="/questionnaire" className="hover:text-brand-600">Get Matched</Link></li>
                 <li><Link to="/search" className="hover:text-brand-600">Browse Directory</Link></li>
                 <li><Link to="/client-benefits" className="hover:text-brand-600">Why Use Us</Link></li>
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-slate-900 mb-4">Coaches</h4>
               <ul className="space-y-2 text-sm text-slate-500 font-medium">
                 <li><Link to="/coach-signup" className="hover:text-brand-600">Join Network</Link></li>
                 <li><Link to="/pricing" className="hover:text-brand-600">Pricing</Link></li>
                 <li><Link to="/for-coaches" className="hover:text-brand-600">Portal Login</Link></li>
               </ul>
            </div>

             <div>
               <h4 className="font-bold text-slate-900 mb-4">Support</h4>
               <ul className="space-y-2 text-sm text-slate-500 font-medium">
                 <li><Link to="/contact" className="hover:text-brand-600">Contact Us</Link></li>
                 <li><a href="mailto:accounts@coachdog.co.uk" className="hover:text-brand-600">accounts@coachdog.co.uk</a></li>
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
               <ul className="space-y-2 text-sm text-slate-500 font-medium">
                 <li><Link to="/privacy" className="hover:text-brand-600">Privacy Policy</Link></li>
                 <li><Link to="/terms" className="hover:text-brand-600">Terms of Service</Link></li>
               </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
              <p className="text-slate-400 text-sm font-medium">© 2024 CoachDog. All rights reserved.</p>
              <div className="flex space-x-4 text-xs text-slate-400">
                <Link to="/privacy" className="hover:text-brand-600 font-medium">Privacy</Link>
                <span>·</span>
                <Link to="/terms" className="hover:text-brand-600 font-medium">Terms</Link>
              </div>
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
               {/* Mock Socials */}
               <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
               <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
               <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
            </div>
          </div>
        </div>
      </footer>

      {/* Trial Login Notification - Bottom right notification */}
      {coach && <TrialLoginNotification coach={coach} />}
    </div>
  );
};