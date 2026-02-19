import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Settings, Shield, BarChart, CheckCircle, XCircle } from 'lucide-react';

export const CookiesPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">
            Cookies Policy
          </h1>
          <p className="text-slate-600">
            Last Updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-8">
          <p className="text-slate-700 mb-4">
            At CoachDog, we use cookies and similar tracking technologies to enhance your experience on our platform. This Cookies Policy explains what cookies are, how we use them, and how you can control your cookie preferences.
          </p>
          <p className="text-slate-700 mb-4">
            By using our website, you consent to our use of cookies in accordance with this policy. If you have any questions, please contact us at{' '}
            <a href="mailto:privacy@coachdog.co.uk" className="text-brand-600 hover:underline">
              privacy@coachdog.co.uk
            </a>
          </p>
        </section>

        {/* What Are Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <Cookie className="h-6 w-6 mr-3 text-brand-600" />
            What Are Cookies?
          </h2>
          <p className="text-slate-700 mb-4">
            Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They help websites recognize your device and store information about your preferences or past actions.
          </p>
          <p className="text-slate-700">
            Cookies can be "persistent" (remain on your device until deleted) or "session" cookies (deleted when you close your browser).
          </p>
        </section>

        {/* Types of Cookies We Use */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <Settings className="h-6 w-6 mr-3 text-brand-600" />
            Types of Cookies We Use
          </h2>

          {/* Strictly Necessary Cookies */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Strictly Necessary Cookies
            </h3>
            <p className="text-slate-700 mb-2">
              These cookies are essential for the website to function properly. They enable core functionality such as user authentication, security, and session management.
            </p>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-sm text-green-900 font-medium">
                <strong>Cannot be disabled:</strong> These cookies are required for the platform to work. Without them, you won't be able to log in or access your account.
              </p>
            </div>
            <ul className="mt-3 space-y-2 text-slate-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Authentication cookies:</strong> Keep you logged into your account</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Security cookies:</strong> Detect fraudulent activity and protect your account</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Session cookies:</strong> Maintain your session while browsing</span>
              </li>
            </ul>
          </div>

          {/* Performance/Analytics Cookies */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-blue-600" />
              Performance & Analytics Cookies
            </h3>
            <p className="text-slate-700 mb-2">
              These cookies help us understand how visitors interact with our website by collecting anonymous information about page views, traffic sources, and user behavior.
            </p>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-sm text-amber-900 font-medium">
                <strong>Optional:</strong> You can opt out of these cookies. Disabling them won't affect your ability to use CoachDog, but it limits our ability to improve the platform.
              </p>
            </div>
            <ul className="mt-3 space-y-2 text-slate-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Google Analytics:</strong> Track page views and user journeys</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Performance monitoring:</strong> Identify slow pages and technical issues</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Heatmaps:</strong> Understand which features are most used</span>
              </li>
            </ul>
          </div>

          {/* Functional Cookies */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-purple-600" />
              Functional Cookies
            </h3>
            <p className="text-slate-700 mb-2">
              These cookies remember your preferences and settings to provide a personalized experience.
            </p>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-sm text-purple-900 font-medium">
                <strong>Optional:</strong> Disabling these cookies may result in a less personalized experience.
              </p>
            </div>
            <ul className="mt-3 space-y-2 text-slate-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Language preference:</strong> Remember your language choice</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Display settings:</strong> Remember your view preferences (e.g., list vs grid view)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong>Recently viewed:</strong> Show coaches you've recently viewed</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Third-Party Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-3 text-brand-600" />
            Third-Party Cookies
          </h2>
          <p className="text-slate-700 mb-4">
            We use trusted third-party services that may set their own cookies:
          </p>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>
                <strong>Stripe:</strong> For secure payment processing (strictly necessary)
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>
                <strong>Google Analytics:</strong> For website analytics (optional)
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <div>
                <strong>Supabase:</strong> For authentication and database services (strictly necessary)
              </div>
            </li>
          </ul>
        </section>

        {/* How to Manage Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <Settings className="h-6 w-6 mr-3 text-brand-600" />
            How to Manage Your Cookie Preferences
          </h2>
          <p className="text-slate-700 mb-4">
            You can manage your cookie preferences in the following ways:
          </p>

          <div className="space-y-4">
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-200">
              <h3 className="font-bold text-brand-900 mb-2">Cookie Banner Settings</h3>
              <p className="text-sm text-brand-800">
                When you first visit CoachDog, a cookie consent banner appears. You can accept all cookies, reject optional cookies, or customize your preferences.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">Browser Settings</h3>
              <p className="text-sm text-slate-700 mb-2">
                Most browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="text-sm text-slate-700 space-y-1 ml-4">
                <li>• Block all cookies</li>
                <li>• Delete existing cookies</li>
                <li>• Allow cookies only from specific websites</li>
              </ul>
              <p className="text-xs text-slate-500 mt-2">
                Note: Blocking all cookies may prevent you from using essential features of CoachDog.
              </p>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            Your Rights
          </h2>
          <p className="text-slate-700 mb-4">
            Under UK GDPR, you have the right to:
          </p>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Withdraw your consent to optional cookies at any time</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Request information about the data we collect via cookies</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Request deletion of data collected through optional cookies</span>
            </li>
          </ul>
          <p className="text-slate-700 mt-4">
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@coachdog.co.uk" className="text-brand-600 hover:underline">
              privacy@coachdog.co.uk
            </a>
          </p>
        </section>

        {/* Changes to Policy */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            Changes to This Policy
          </h2>
          <p className="text-slate-700">
            We may update this Cookies Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Questions or Concerns?
          </h2>
          <p className="text-slate-700 mb-4">
            If you have any questions about our use of cookies, please don't hesitate to contact us:
          </p>
          <div className="space-y-1 text-slate-700">
            <p>Email: <a href="mailto:privacy@coachdog.co.uk" className="text-brand-600 hover:underline font-medium">privacy@coachdog.co.uk</a></p>
            <p>Support: <a href="mailto:support@coachdog.co.uk" className="text-brand-600 hover:underline font-medium">support@coachdog.co.uk</a></p>
          </div>
        </section>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-brand-600 hover:text-brand-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
