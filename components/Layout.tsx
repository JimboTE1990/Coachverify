import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, User, Search, HelpCircle, Mail, CreditCard, LogIn, UserPlus, LayoutDashboard, ClipboardList } from 'lucide-react';

// --- Custom Logo Components ---

const DalmatianHeadLogo = ({ className = "h-12 w-12" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Head Background - White */}
    <path d="M50 18C30 18 15 35 15 55C15 78 32 90 50 90C68 90 85 78 85 55C85 35 70 18 50 18Z" fill="white" stroke="#1e293b" strokeWidth="4"/>
    
    {/* Ears */}
    {/* Left Ear */}
    <path d="M20 30C10 30 2 45 5 60C8 70 18 65 22 55" fill="white" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Right Ear */}
    <path d="M80 30C90 30 98 45 95 60C92 70 82 65 78 55" fill="white" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    
    {/* Spots */}
    <path d="M12 45C12 43 14 43 14 45C14 47 12 47 12 45Z" fill="#1e293b" />
    <circle cx="15" cy="50" r="3" fill="#1e293b"/>
    <circle cx="85" cy="45" r="3" fill="#1e293b"/>
    <circle cx="88" cy="52" r="2" fill="#1e293b"/>
    <circle cx="30" cy="35" r="3" fill="#1e293b"/>
    <circle cx="70" cy="32" r="2.5" fill="#1e293b"/>

    {/* Eyes */}
    <ellipse cx="38" cy="52" rx="4" ry="5" fill="#1e293b"/>
    <ellipse cx="62" cy="52" rx="4" ry="5" fill="#1e293b"/>
    
    {/* Shine in eyes */}
    <circle cx="39" cy="50" r="1.5" fill="white"/>
    <circle cx="63" cy="50" r="1.5" fill="white"/>

    {/* Nose */}
    <path d="M42 66C42 62 46 60 50 60C54 60 58 62 58 66C58 72 50 74 50 74C50 74 42 72 42 66Z" fill="#1e293b"/>
    
    {/* Mouth */}
    <path d="M50 74V78M40 76C43 80 47 80 50 78C53 80 57 80 60 76" stroke="#1e293b" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const CoachDogBrand = ({ className = "text-3xl" }: { className?: string }) => (
  <span className={`${className} font-display font-extrabold text-slate-900 tracking-tight flex items-center`}>
    CoachD
    <span className="relative mx-0.5 inline-flex items-center justify-center h-[0.8em] w-[0.8em] bg-brand-500 rounded-full text-white shadow-sm ring-2 ring-white">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="h-[0.5em] w-[0.5em]">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
    g
  </span>
);

export { DalmatianHeadLogo, CoachDogBrand };

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      {/* Sticky Header with Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300" ref={navRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24"> {/* Increased height */}
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group" onClick={closeMobileMenu}>
              {/* Logo Container matching the blue gradient square */}
              <div className="h-14 w-14 bg-gradient-to-b from-indigo-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-brand-500/30 transition-all duration-300 group-hover:scale-105 p-1">
                <DalmatianHeadLogo className="h-full w-full drop-shadow-md" />
              </div>
              <CoachDogBrand />
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
                      <NavMenuItem 
                        to="/client-benefits" 
                        icon={HelpCircle} 
                        label="Why Use Us?" 
                        desc="Learn about our verification process"
                        colorClass="bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white"
                      />
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
                      <div className="border-t border-slate-100 my-2 mx-3"></div>
                      <NavMenuItem 
                        to="/for-coaches" 
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
                    </div>
                  </div>
                )}
              </div>

              <Link to="/questionnaire" className="ml-4 relative overflow-hidden group bg-brand-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-brand-500/30 hover:bg-brand-700 transition-all hover:-translate-y-0.5">
                <span className="relative z-10 flex items-center text-base">Get Matched <ClipboardList className="ml-2 h-5 w-5" /></span>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-brand-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 h-[calc(100vh-6rem)] overflow-y-auto pb-20 animate-fade-in">
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
                  <Link to="/for-coaches" className="flex items-center px-5 py-4 rounded-2xl bg-slate-50 text-slate-800 font-bold" onClick={closeMobileMenu}>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-1">
               <div className="flex items-center space-x-2 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-b from-indigo-500 to-teal-500 p-1 rounded-xl text-white shadow-md">
                    <DalmatianHeadLogo className="h-full w-full" />
                  </div>
                  <CoachDogBrand className="text-xl" />
               </div>
               <p className="text-slate-500 text-sm font-medium">The most trusted verification platform for life coaches worldwide.</p>
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
                 <li><a href="mailto:accounts@coachdog.com" className="hover:text-brand-600">accounts@coachdog.com</a></li>
               </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm font-medium">© 2024 CoachDog. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
               {/* Mock Socials */}
               <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
               <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
               <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};