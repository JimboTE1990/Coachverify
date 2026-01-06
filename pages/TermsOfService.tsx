import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertCircle } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-600">
            Last Updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-8">
          <p className="text-slate-700 mb-4">
            Welcome to CoachDog. These Terms of Service ("Terms") govern your access to and use of our platform, which connects verified coaches with users seeking coaching services.
          </p>
          <p className="text-slate-700 mb-4">
            By accessing or using CoachDog, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our platform.
          </p>
        </section>

        {/* Acceptance of Terms */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <FileText className="h-6 w-6 mr-3 text-brand-600" />
            1. Acceptance of Terms
          </h2>
          <p className="text-slate-700 mb-4">
            By creating an account or using CoachDog, you acknowledge that you have read, understood, and agree to be bound by these Terms and our{' '}
            <Link to="/privacy" className="text-brand-600 hover:underline font-medium">
              Privacy Policy
            </Link>
            . If you are using the platform on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
          </p>
        </section>

        {/* Eligibility */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            2. Eligibility
          </h2>
          <p className="text-slate-700 mb-4">
            To use CoachDog, you must:
          </p>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li>Be at least 18 years of age</li>
            <li>For coaches: Hold valid coaching credentials from a recognized accreditation body</li>
            <li>Have the legal capacity to enter into a binding contract</li>
            <li>Not be prohibited from using the platform under applicable laws</li>
          </ul>
        </section>

        {/* Account Registration */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            3. Account Registration and Security
          </h2>
          <p className="text-slate-700 mb-4">
            When you create a CoachDog account:
          </p>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li>You must provide accurate, complete, and current information</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You must not share your account with others</li>
            <li>You must notify us immediately of any unauthorized use of your account</li>
            <li>You are responsible for all activities that occur under your account</li>
          </ul>
          <p className="text-slate-700 mt-4">
            We reserve the right to suspend or terminate accounts that violate these Terms or contain false information.
          </p>
        </section>

        {/* Coach Verification */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            4. Coach Verification Process
          </h2>
          <p className="text-slate-700 mb-4">
            For coaches creating profiles on CoachDog:
          </p>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li>You must provide valid coaching credentials from a recognized accreditation body</li>
            <li>You authorize us to verify your credentials with the relevant accreditation body</li>
            <li>You must maintain active, valid credentials while using the platform</li>
            <li>You must update your profile if your credentials change or expire</li>
            <li>You represent that all information in your profile is accurate and truthful</li>
          </ul>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-yellow-900 text-sm">
                <strong>Important:</strong> Providing false credentials or misrepresenting your qualifications is a serious violation and will result in immediate account termination and may result in legal action.
              </p>
            </div>
          </div>
        </section>

        {/* Subscriptions and Payment */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            5. Subscriptions and Payment
          </h2>

          <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">5.1 Subscription Plans</h3>
          <p className="text-slate-700 mb-4">
            CoachDog offers monthly and annual subscription plans for coaches. All plans include a 30-day free trial for new users.
          </p>

          <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">5.2 Billing</h3>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li>Subscriptions are billed in advance on a recurring basis</li>
            <li>You authorize us to charge your payment method on file</li>
            <li>If payment fails, we will attempt to process payment again. Repeated failures may result in service suspension</li>
            <li>All prices are in GBP (£) and include applicable taxes</li>
            <li>We reserve the right to change pricing with 30 days' notice to active subscribers</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">5.3 Free Trial</h3>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li>New users receive a 30-day free trial upon signup</li>
            <li>You must provide payment information to start your trial</li>
            <li>If you add a subscription during your trial, billing begins after the trial ends</li>
            <li>Free trials are limited to one per user</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">5.4 Cancellation and Refunds</h3>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li>You can cancel your subscription anytime from your account settings</li>
            <li>Cancellation takes effect at the end of your current billing period</li>
            <li>You will retain access until the end of your paid period</li>
            <li>We do not offer refunds for partial months or unused subscription time</li>
            <li>If you cancel during your free trial, you will not be charged</li>
          </ul>
        </section>

        {/* User Conduct */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            6. User Conduct and Prohibited Activities
          </h2>
          <p className="text-slate-700 mb-4">
            You agree not to:
          </p>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on the intellectual property rights of others</li>
            <li>Upload malicious code, viruses, or harmful content</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Use the platform for any fraudulent or illegal purpose</li>
            <li>Scrape or collect data from the platform without permission</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Impersonate another person or entity</li>
            <li>Create multiple accounts to abuse free trials or promotions</li>
          </ul>
        </section>

        {/* Intellectual Property */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            7. Intellectual Property Rights
          </h2>
          <p className="text-slate-700 mb-4">
            All content on CoachDog, including text, graphics, logos, and software, is the property of CoachDog or our licensors and is protected by copyright, trademark, and other intellectual property laws.
          </p>
          <p className="text-slate-700 mb-4">
            You retain ownership of any content you submit to the platform (e.g., profile information, photos). By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on the platform.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            8. Limitation of Liability
          </h2>
          <p className="text-slate-700 mb-4">
            CoachDog is a platform that facilitates connections between coaches and users. We are not responsible for:
          </p>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li>The quality, safety, or legality of coaching services provided by coaches</li>
            <li>The accuracy of information provided by coaches or users</li>
            <li>Disputes between coaches and users</li>
            <li>Any loss or damage resulting from your use of the platform</li>
          </ul>
          <p className="text-slate-700 mt-4">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, COACHVERIFY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.
          </p>
        </section>

        {/* Disclaimer of Warranties */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            9. Disclaimer of Warranties
          </h2>
          <p className="text-slate-700">
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
          </p>
        </section>

        {/* Indemnification */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            10. Indemnification
          </h2>
          <p className="text-slate-700">
            You agree to indemnify and hold harmless CoachDog, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the platform, violation of these Terms, or infringement of any third-party rights.
          </p>
        </section>

        {/* Termination */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            11. Termination
          </h2>
          <p className="text-slate-700 mb-4">
            We reserve the right to suspend or terminate your account at any time, with or without notice, if:
          </p>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li>You violate these Terms</li>
            <li>You engage in fraudulent or illegal activity</li>
            <li>Your payment method fails repeatedly</li>
            <li>We are required to do so by law</li>
          </ul>
          <p className="text-slate-700 mt-4">
            Upon termination, your right to use the platform will cease immediately, and we may delete your account and content.
          </p>
        </section>

        {/* Governing Law */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            12. Governing Law and Dispute Resolution
          </h2>
          <p className="text-slate-700 mb-4">
            These Terms are governed by the laws of England and Wales. Any disputes arising from these Terms or your use of the platform shall be subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        {/* Changes to Terms */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            13. Changes to These Terms
          </h2>
          <p className="text-slate-700">
            We may update these Terms from time to time. When we make significant changes, we will notify you by email and/or display a prominent notice on our platform. Your continued use of the platform after changes become effective constitutes acceptance of the updated Terms.
          </p>
        </section>

        {/* Contact Us */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
            14. Contact Information
          </h2>
          <p className="text-slate-700 mb-4">
            If you have any questions about these Terms, please contact us:
          </p>
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-6">
            <p className="text-slate-900 font-medium mb-2">CoachDog Legal Team</p>
            <p className="text-slate-700 mb-1">
              <strong>Email:</strong>{' '}
              <a href="mailto:legal@coachdog.com" className="text-brand-600 hover:underline">
                legal@coachdog.com
              </a>
            </p>
            <p className="text-slate-700">
              <strong>Support:</strong>{' '}
              <a href="mailto:support@coachdog.com" className="text-brand-600 hover:underline">
                support@coachdog.com
              </a>
            </p>
          </div>
        </section>

        {/* Footer Links */}
        <div className="pt-8 border-t border-slate-200 text-center">
          <p className="text-slate-600 mb-4">
            By using CoachDog, you agree to these Terms of Service and our{' '}
            <Link to="/privacy" className="text-brand-600 hover:underline font-medium">
              Privacy Policy
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
