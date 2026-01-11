import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Database, UserCheck, Trash2, FileText } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-600">
            Last Updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-8">
          <p className="text-slate-700 mb-4">
            At CoachDog, we take your privacy seriously. This Privacy Policy explains how we collect, use, protect, and handle your personal information when you use our platform to connect verified coaches with users seeking coaching services.
          </p>
          <p className="text-slate-700 mb-4">
            We are committed to compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. If you have any questions about this policy, please contact us at{' '}
            <a href="mailto:privacy@coachdog.co.uk" className="text-brand-600 hover:underline">
              privacy@coachdog.co.uk
            </a>
          </p>
        </section>

        {/* Data Controller */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <UserCheck className="h-6 w-6 mr-3 text-brand-600" />
            Data Controller
          </h2>
          <p className="text-slate-700 mb-2">
            CoachDog is the data controller for the personal information we process. You can contact us at:
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-slate-700">
            <p className="font-medium">CoachDog</p>
            <p>Email: <a href="mailto:privacy@coachdog.co.uk" className="text-brand-600 hover:underline">privacy@coachdog.co.uk</a></p>
            <p>Support: <a href="mailto:support@coachdog.co.uk" className="text-brand-600 hover:underline">support@coachdog.co.uk</a></p>
          </div>
        </section>

        {/* Information We Collect */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <Database className="h-6 w-6 mr-3 text-brand-600" />
            Information We Collect
          </h2>

          <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">1. Information You Provide Directly</h3>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li><strong>Account Information:</strong> Name, email address, password (encrypted), date of birth</li>
            <li><strong>Coach Profiles:</strong> Professional credentials, accreditation body, registration number, bio, specializations, location, profile photo, contact preferences</li>
            <li><strong>Payment Information:</strong> Processed securely by Stripe (we never store full card details - only Stripe customer ID and subscription ID for billing purposes)</li>
            <li><strong>Communication:</strong> Messages sent through our contact forms or support emails</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">2. Information We Collect Automatically</h3>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li><strong>Usage Data:</strong> Pages visited, features used, search queries, time spent on platform</li>
            <li><strong>Device Information:</strong> Browser type, operating system, IP address, device identifiers</li>
            <li><strong>Cookies:</strong> Session cookies for authentication, analytics cookies to improve our service (see Cookie Policy below)</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">3. Information We Do NOT Collect</h3>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li>We do not collect sensitive personal data such as health information, racial or ethnic origin, political opinions, or religious beliefs</li>
            <li>We do not track your location without explicit consent</li>
            <li>We do not sell your personal data to third parties</li>
          </ul>
        </section>

        {/* How We Use Your Information */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <FileText className="h-6 w-6 mr-3 text-brand-600" />
            How We Use Your Information
          </h2>

          <div className="space-y-4 text-slate-700">
            <p>We use your personal information for the following purposes, based on lawful grounds under UK GDPR:</p>

            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">Contract Performance</h4>
              <ul className="ml-6 list-disc space-y-1">
                <li>Creating and managing your account</li>
                <li>Processing subscription payments</li>
                <li>Displaying coach profiles to users</li>
                <li>Facilitating connections between coaches and users</li>
                <li>Providing customer support</li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">Legitimate Interests</h4>
              <ul className="ml-6 list-disc space-y-1">
                <li>Improving our platform and user experience</li>
                <li>Analyzing usage patterns to enhance features</li>
                <li>Detecting and preventing fraud or abuse</li>
                <li>Ensuring platform security</li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">Legal Compliance</h4>
              <ul className="ml-6 list-disc space-y-1">
                <li>Complying with legal obligations</li>
                <li>Responding to lawful requests from authorities</li>
                <li>Enforcing our Terms of Service</li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">Consent (where applicable)</h4>
              <ul className="ml-6 list-disc space-y-1">
                <li>Sending marketing communications (you can opt out anytime)</li>
                <li>Using analytics cookies (you can disable in browser settings)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Security & Encryption */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <Lock className="h-6 w-6 mr-3 text-brand-600" />
            Security & Encryption
          </h2>

          <p className="text-slate-700 mb-4">
            We implement industry-standard security measures to protect your personal information:
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-bold text-green-900 mb-2">Encryption at Rest</h4>
              <p className="text-green-800 text-sm">
                All data stored in our database is encrypted using AES-256 encryption
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-bold text-green-900 mb-2">Encryption in Transit</h4>
              <p className="text-green-800 text-sm">
                All data transmission uses TLS 1.3 encryption (HTTPS)
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-bold text-green-900 mb-2">Password Security</h4>
              <p className="text-green-800 text-sm">
                Passwords are hashed using bcrypt with salt, never stored in plain text
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-bold text-green-900 mb-2">Payment Security</h4>
              <p className="text-green-800 text-sm">
                PCI-DSS compliant payment processing through Stripe (we never see your card details)
              </p>
            </div>
          </div>

          <p className="text-slate-700">
            Our database is hosted by Supabase (PostgreSQL) with automatic backups, row-level security policies, and continuous monitoring for suspicious activity.
          </p>
        </section>

        {/* Third-Party Services */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-3 text-brand-600" />
            Third-Party Services
          </h2>

          <p className="text-slate-700 mb-4">
            We use the following trusted third-party services to operate our platform:
          </p>

          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">Stripe (Payment Processing)</h4>
              <p className="text-slate-700 text-sm mb-2">
                Handles all payment transactions. Your payment information is processed directly by Stripe and never stored on our servers.
              </p>
              <p className="text-slate-600 text-xs">
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  Stripe Privacy Policy →
                </a>
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">Supabase (Database & Authentication)</h4>
              <p className="text-slate-700 text-sm mb-2">
                Hosts our database and handles authentication. Data is stored in secure EU/UK data centers with AES-256 encryption.
              </p>
              <p className="text-slate-600 text-xs">
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  Supabase Privacy Policy →
                </a>
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">Vercel (Hosting)</h4>
              <p className="text-slate-700 text-sm mb-2">
                Hosts our web application with CDN distribution for fast, secure access worldwide.
              </p>
              <p className="text-slate-600 text-xs">
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  Vercel Privacy Policy →
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Your Rights Under GDPR */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <UserCheck className="h-6 w-6 mr-3 text-brand-600" />
            Your Rights Under UK GDPR
          </h2>

          <p className="text-slate-700 mb-4">
            Under UK GDPR, you have the following rights regarding your personal data:
          </p>

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 mb-1">Right to Access</h4>
              <p className="text-blue-800 text-sm">
                You can request a copy of all personal data we hold about you. Contact{' '}
                <a href="mailto:privacy@coachdog.co.uk" className="underline">privacy@coachdog.co.uk</a> to request your data export.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 mb-1">Right to Rectification</h4>
              <p className="text-blue-800 text-sm">
                You can update your personal information anytime through your account settings or by contacting support.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 mb-1">Right to Erasure ("Right to be Forgotten")</h4>
              <p className="text-blue-800 text-sm">
                You can request deletion of your account and all associated data. Go to Account Settings → Delete Account, or email{' '}
                <a href="mailto:privacy@coachdog.co.uk" className="underline">privacy@coachdog.co.uk</a>. We will permanently delete your data within 30 days, except where we're legally required to retain it.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 mb-1">Right to Data Portability</h4>
              <p className="text-blue-800 text-sm">
                You can request your data in a machine-readable format (CSV/JSON) to transfer to another service.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 mb-1">Right to Restrict Processing</h4>
              <p className="text-blue-800 text-sm">
                You can request that we limit how we use your data while we address any concerns you have.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 mb-1">Right to Object</h4>
              <p className="text-blue-800 text-sm">
                You can object to processing based on legitimate interests. We will stop processing unless we have compelling grounds to continue.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 mb-1">Right to Withdraw Consent</h4>
              <p className="text-blue-800 text-sm">
                Where we process data based on consent (e.g., marketing emails), you can withdraw consent anytime by clicking "unsubscribe" or contacting us.
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
            <p className="text-yellow-900 text-sm">
              <strong>To exercise any of these rights:</strong> Email us at{' '}
              <a href="mailto:privacy@coachdog.co.uk" className="underline">privacy@coachdog.co.uk</a>{' '}
              with your request. We will respond within 30 days. If you're unsatisfied with our response, you have the right to lodge a complaint with the{' '}
              <a href="https://ico.org.uk/" target="_blank" rel="noopener noreferrer" className="underline">
                Information Commissioner's Office (ICO)
              </a>.
            </p>
          </div>
        </section>

        {/* Data Deletion */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <Trash2 className="h-6 w-6 mr-3 text-brand-600" />
            How to Delete Your Data
          </h2>

          <p className="text-slate-700 mb-4">
            You have full control over your data. To permanently delete your account and all associated information:
          </p>

          <div className="bg-slate-50 rounded-xl p-6 mb-4">
            <h4 className="font-bold text-slate-900 mb-3">Option 1: Self-Service Deletion</h4>
            <ol className="ml-6 list-decimal space-y-2 text-slate-700">
              <li>Log in to your CoachDog account</li>
              <li>Navigate to Dashboard → Account Settings</li>
              <li>Scroll to "Delete Account" section</li>
              <li>Click "Delete My Account" and confirm</li>
              <li>Your data will be permanently deleted within 30 days</li>
            </ol>
          </div>

          <div className="bg-slate-50 rounded-xl p-6">
            <h4 className="font-bold text-slate-900 mb-3">Option 2: Email Request</h4>
            <p className="text-slate-700 mb-2">
              Send an email to{' '}
              <a href="mailto:privacy@coachdog.co.uk" className="text-brand-600 hover:underline font-medium">
                privacy@coachdog.co.uk
              </a>{' '}
              with the subject "Account Deletion Request" and include:
            </p>
            <ul className="ml-6 list-disc space-y-1 text-slate-700">
              <li>Your registered email address</li>
              <li>Confirmation that you want to delete all data</li>
            </ul>
            <p className="text-slate-600 text-sm mt-3">
              We will verify your identity and process your request within 30 days.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
            <p className="text-red-900 text-sm">
              <strong>Important:</strong> Account deletion is permanent and cannot be undone. All your profile information, subscription history, and settings will be permanently erased. If you have an active subscription, it will be cancelled, and we will not issue refunds for unused time.
            </p>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            Data Retention
          </h2>

          <p className="text-slate-700 mb-4">
            We retain your personal data only as long as necessary for the purposes outlined in this policy:
          </p>

          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
            <li><strong>Cancelled Subscriptions:</strong> Billing data retained for 7 years (UK tax law requirement)</li>
            <li><strong>Deleted Accounts:</strong> All personal data permanently deleted within 30 days (except legal obligations)</li>
            <li><strong>Marketing Preferences:</strong> Retained until you unsubscribe or delete your account</li>
            <li><strong>Support Tickets:</strong> Retained for 3 years for quality assurance</li>
          </ul>
        </section>

        {/* Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            Cookie Policy
          </h2>

          <p className="text-slate-700 mb-4">
            We use cookies to improve your experience on our platform:
          </p>

          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-1">Essential Cookies (Required)</h4>
              <p className="text-slate-700 text-sm">
                Authentication tokens to keep you logged in, session management, security features. These cannot be disabled as they're necessary for the platform to function.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-1">Analytics Cookies (Optional)</h4>
              <p className="text-slate-700 text-sm">
                Help us understand how users interact with our platform to improve features. You can disable these in your browser settings.
              </p>
            </div>
          </div>

          <p className="text-slate-600 text-sm mt-4">
            You can control cookies through your browser settings. Disabling essential cookies may prevent certain features from working properly.
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            Children's Privacy
          </h2>

          <p className="text-slate-700">
            CoachDog is not intended for users under the age of 18. We do not knowingly collect personal information from children. Coaches must be at least 18 years old to create an account. If we discover that we have collected data from a child, we will delete it immediately. If you believe a child has provided us with personal information, please contact{' '}
            <a href="mailto:privacy@coachdog.co.uk" className="text-brand-600 hover:underline">
              privacy@coachdog.co.uk
            </a>.
          </p>
        </section>

        {/* International Transfers */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            International Data Transfers
          </h2>

          <p className="text-slate-700 mb-4">
            Your data is primarily stored in secure data centers within the UK and EU. When we use third-party services (like Stripe or Supabase), data may be transferred internationally. We ensure all transfers comply with UK GDPR through:
          </p>

          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li>Standard Contractual Clauses (SCCs) with service providers</li>
            <li>Adequacy decisions for transfers to approved countries</li>
            <li>Additional safeguards such as encryption in transit and at rest</li>
          </ul>
        </section>

        {/* Changes to Privacy Policy */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            Changes to This Privacy Policy
          </h2>

          <p className="text-slate-700">
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we make significant changes, we will notify you by email and/or display a prominent notice on our platform. The "Last Updated" date at the top of this page shows when the policy was last revised. We encourage you to review this policy periodically.
          </p>
        </section>

        {/* Contact Us */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            Contact Us
          </h2>

          <p className="text-slate-700 mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us:
          </p>

          <div className="bg-brand-50 border border-brand-200 rounded-xl p-6">
            <p className="text-slate-900 font-medium mb-2">CoachDog Privacy Team</p>
            <p className="text-slate-700 mb-1">
              <strong>Email:</strong>{' '}
              <a href="mailto:privacy@coachdog.co.uk" className="text-brand-600 hover:underline">
                privacy@coachdog.co.uk
              </a>
            </p>
            <p className="text-slate-700">
              <strong>Support:</strong>{' '}
              <a href="mailto:support@coachdog.co.uk" className="text-brand-600 hover:underline">
                support@coachdog.co.uk
              </a>
            </p>
          </div>

          <p className="text-slate-600 text-sm mt-4">
            We aim to respond to all privacy inquiries within 5 business days and formal GDPR requests within 30 days.
          </p>
        </section>

        {/* Footer Links */}
        <div className="pt-8 border-t border-slate-200 text-center">
          <p className="text-slate-600 mb-4">
            By using CoachDog, you agree to this Privacy Policy and our{' '}
            <Link to="/terms" className="text-brand-600 hover:underline font-medium">
              Terms of Service
            </Link>.
          </p>
          <Link
            to="/"
            className="inline-block bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
