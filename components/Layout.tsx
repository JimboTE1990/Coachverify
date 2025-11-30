import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, User, Menu, X } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <ShieldCheck className="h-8 w-8 text-brand-600" />
              <span className="text-xl font-bold text-slate-900 tracking-tight">CoachVerify</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/search" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Find a Coach</Link>
              <Link to="/for-coaches" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">For Coaches</Link>
              <Link to="/admin" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">
                 {location.pathname.includes('admin') ? 'Admin Panel' : 'Log In'}
              </Link>
              <Link to="/questionnaire" className="bg-brand-600 text-white px-5 py-2 rounded-full font-medium hover:bg-brand-700 transition-all shadow-md hover:shadow-lg">
                Get Matched
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/search" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-slate-50">Find a Coach</Link>
              <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-slate-50">Admin/Login</Link>
              <Link to="/questionnaire" className="block w-full text-center mt-4 px-5 py-3 rounded-md font-bold text-white bg-brand-600">
                Get Matched
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
             <ShieldCheck className="h-6 w-6 text-slate-400" />
             <span className="text-slate-500 font-semibold">CoachVerify</span>
          </div>
          <p className="text-slate-400 text-sm">© 2024 CoachVerify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};