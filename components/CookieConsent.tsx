import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Settings } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  functional: boolean;
}

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consentGiven = localStorage.getItem('cookieConsent');
    if (!consentGiven) {
      // Show banner after a short delay for better UX
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      // Load saved preferences
      try {
        const savedPrefs = JSON.parse(consentGiven);
        setPreferences(savedPrefs);
        applyPreferences(savedPrefs);
      } catch (e) {
        console.error('Failed to parse cookie preferences');
      }
    }
  }, []);

  const applyPreferences = (prefs: CookiePreferences) => {
    // Apply analytics preference
    if (prefs.analytics) {
      // Enable Google Analytics or other analytics tools
      enableAnalytics();
    } else {
      // Disable analytics
      disableAnalytics();
    }

    // Apply functional cookie preference
    if (!prefs.functional) {
      // Clear functional cookies if disabled
      clearFunctionalCookies();
    }
  };

  const enableAnalytics = () => {
    // Enable Google Analytics if configured
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
  };

  const disableAnalytics = () => {
    // Disable Google Analytics
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  };

  const clearFunctionalCookies = () => {
    // Clear non-essential cookies
    const cookiesToKeep = ['cookieConsent', 'sb-access-token', 'sb-refresh-token'];
    document.cookie.split(';').forEach((cookie) => {
      const cookieName = cookie.split('=')[0].trim();
      if (!cookiesToKeep.includes(cookieName)) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      functional: true,
    };
    savePreferences(allAccepted);
  };

  const handleRejectOptional = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      functional: false,
    };
    savePreferences(onlyNecessary);
  };

  const handleSaveCustom = () => {
    savePreferences(preferences);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    applyPreferences(prefs);
    setIsVisible(false);
    setShowCustomize(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden">
          {!showCustomize ? (
            // Main Banner
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                  <Cookie className="h-6 w-6 text-brand-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    We Value Your Privacy
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    We use cookies to enhance your experience, analyze site traffic, and personalize content.
                    Strictly necessary cookies are always enabled. You can customize your preferences or accept all cookies.{' '}
                    <Link to="/cookies" className="text-brand-600 hover:underline font-medium">
                      Learn more
                    </Link>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors"
                >
                  Accept All Cookies
                </button>
                <button
                  onClick={handleRejectOptional}
                  className="flex-1 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Reject Optional
                </button>
                <button
                  onClick={() => setShowCustomize(true)}
                  className="flex-1 border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Customize
                </button>
              </div>
            </div>
          ) : (
            // Customize Panel
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Customize Cookie Preferences</h3>
                <button
                  onClick={() => setShowCustomize(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Strictly Necessary */}
                <div className="flex items-start justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Strictly Necessary Cookies</h4>
                    <p className="text-sm text-slate-600">
                      Required for the website to function. Cannot be disabled.
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-6 bg-green-600 rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Analytics Cookies</h4>
                    <p className="text-sm text-slate-600">
                      Help us understand how visitors use our site (Google Analytics).
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                      className={`w-12 h-6 rounded-full transition-colors flex items-center ${
                        preferences.analytics ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
                      } px-1`}
                      aria-label="Toggle analytics cookies"
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>

                {/* Functional */}
                <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Functional Cookies</h4>
                    <p className="text-sm text-slate-600">
                      Remember your preferences and settings for a personalized experience.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setPreferences({ ...preferences, functional: !preferences.functional })}
                      className={`w-12 h-6 rounded-full transition-colors flex items-center ${
                        preferences.functional ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
                      } px-1`}
                      aria-label="Toggle functional cookies"
                    >
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveCustom}
                  className="flex-1 bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  onClick={() => setShowCustomize(false)}
                  className="flex-1 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
