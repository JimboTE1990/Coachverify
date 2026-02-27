import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, AlertCircle, Users, UserCheck } from 'lucide-react';
import { CoachSubscriptionAgreement } from '../content/CoachSubscriptionAgreement';

type TermsTab = 'coaches' | 'clients';

export const TermsOfService: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = (searchParams.get('tab') as TermsTab) || 'coaches';
  const [activeTab, setActiveTab] = useState<TermsTab>(defaultTab);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-slate-900">
            Terms of Service
          </h1>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('coaches')}
            className={`pb-4 px-2 font-bold transition-all flex items-center gap-2 ${
              activeTab === 'coaches'
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck className="h-5 w-5" />
            For Coaches
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`pb-4 px-2 font-bold transition-all flex items-center gap-2 ${
              activeTab === 'clients'
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="h-5 w-5" />
            For Visitors & Clients
          </button>
        </div>

        {/* Coach Terms Content */}
        {activeTab === 'coaches' && (
          <CoachSubscriptionAgreement />
        )}

        {/* Client Terms Content */}
        {activeTab === 'clients' && (
          <>
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-6">
                Client Terms of Use
              </h2>
              <p className="text-slate-700 mb-4">
                Last updated: 27 February 2026
              </p>
              <p className="text-slate-700 mb-4">
                These Client Terms of Use ("Client Terms") apply to individuals using CoachDog to identify and connect with accredited coaches ("Clients").
              </p>
              <p className="text-slate-700 mb-4">
                CoachDog Ltd is a company incorporated in England and Wales (company number [x]) with its registered office at [x] ("CoachDog", "we", "us", "our").
              </p>
              <p className="text-slate-700 mb-4">
                By creating an account or using the Platform, you agree to these Client Terms.
              </p>
            </section>

            {/* 1. Our Role */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
                1. Our Role
              </h2>
              <p className="text-slate-700 mb-3">
                <strong>1.1</strong> CoachDog provides a digital platform that facilitates introductions between Clients and independent accredited Coaches.
              </p>
              <p className="text-slate-700 mb-3">
                <strong>1.2</strong> We do not:
              </p>
              <ul className="space-y-2 text-slate-700 ml-6 list-disc mb-3">
                <li>Provide coaching services;</li>
                <li>Supervise Coaches;</li>
                <li>Guarantee coaching outcomes;</li>
                <li>Act as agent for any Coach.</li>
              </ul>
              <p className="text-slate-700">
                <strong>1.3</strong> Any coaching engagement is a separate contract directly between you and the Coach.
              </p>
            </section>

            {/* 2. Eligibility */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
                2. Eligibility
              </h2>
              <p className="text-slate-700 mb-3">You must:</p>
              <ul className="space-y-2 text-slate-700 ml-6 list-disc">
                <li>Be at least 18 years old;</li>
                <li>Have legal capacity to enter a binding contract.</li>
              </ul>
            </section>

            {/* 3. Accreditation Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
                3. Accreditation Information
              </h2>
              <p className="text-slate-700 mb-3">
                <strong>3.1</strong> Coaches listed on the Platform state that they hold accreditation with recognised professional bodies (EMCC, ICF, Association for Coaching).
              </p>
              <p className="text-slate-700 mb-3">
                <strong>3.2</strong> CoachDog verifies accreditation at onboarding using publicly available databases where possible.
              </p>
              <p className="text-slate-700 mb-3">
                <strong>3.3</strong> However, we do not guarantee:
              </p>
              <ul className="space-y-2 text-slate-700 ml-6 list-disc mb-3">
                <li>Ongoing accreditation status;</li>
                <li>Accuracy of third-party databases;</li>
                <li>Suitability of any Coach for your needs.</li>
              </ul>
              <p className="text-slate-700">
                You are responsible for conducting your own assessment before engaging a Coach.
              </p>
            </section>

            {/* 4. No Medical or Therapeutic Services */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
                4. No Medical or Therapeutic Services
              </h2>
              <p className="text-slate-700 mb-3">
                <strong>4.1</strong> The Platform is not a provider of medical, psychiatric, or psychological therapy services.
              </p>
              <p className="text-slate-700 mb-3">
                <strong>4.2</strong> If you are experiencing:
              </p>
              <ul className="space-y-2 text-slate-700 ml-6 list-disc mb-3">
                <li>Severe mental health difficulties;</li>
                <li>Crisis;</li>
                <li>Suicidal thoughts;</li>
                <li>Medical emergency;</li>
              </ul>
              <p className="text-slate-700">
                you should contact appropriate emergency services immediately.
              </p>
            </section>

            {/* 5. Disputes with Coaches */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
                5. Disputes with Coaches
              </h2>
              <p className="text-slate-700 mb-3">
                <strong>5.1</strong> Any dispute relating to coaching services must be addressed directly with the Coach.
              </p>
              <p className="text-slate-700 mb-3">
                <strong>5.2</strong> CoachDog is not responsible for:
              </p>
              <ul className="space-y-2 text-slate-700 ml-6 list-disc mb-3">
                <li>Professional negligence;</li>
                <li>Coaching advice;</li>
                <li>Fees agreed independently;</li>
                <li>Outcomes of sessions.</li>
              </ul>
              <p className="text-slate-700">
                We may review complaints at our discretion but are not obliged to intervene.
              </p>
            </section>

            {/* 6. Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
                6. Limitation of Liability
              </h2>
              <p className="text-slate-700 mb-3">
                <strong>6.1</strong> Nothing in these Client Terms excludes or limits liability for:
              </p>
              <ul className="space-y-2 text-slate-700 ml-6 list-disc mb-3">
                <li>Death or personal injury caused by negligence;</li>
                <li>Fraud or fraudulent misrepresentation;</li>
                <li>Any liability which cannot lawfully be excluded under the Consumer Rights Act 2015 or other applicable law.</li>
              </ul>
              <p className="text-slate-700 mb-3">
                <strong>6.2</strong> Subject to 6.1 above, CoachDog shall not be liable for:
              </p>
              <ul className="space-y-2 text-slate-700 ml-6 list-disc mb-3">
                <li>The acts or omissions of any Coach;</li>
                <li>The quality or outcome of coaching services;</li>
                <li>Any indirect or consequential loss.</li>
              </ul>
              <p className="text-slate-700 mb-3">
                <strong>6.3</strong> Where liability arises in connection with the operation of the Platform itself, CoachDog's total liability shall not exceed £100.
              </p>
              <p className="text-slate-700">
                <strong>6.4</strong> This does not affect your statutory rights as a consumer.
              </p>
            </section>

            {/* 7. Platform Availability */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
                7. Platform Availability
              </h2>
              <p className="text-slate-700">
                We do not guarantee uninterrupted availability of the Platform and may suspend or modify it at any time.
              </p>
            </section>

            {/* 8. Data Protection */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
                8. Data Protection
              </h2>
              <p className="text-slate-700 mb-3">
                <strong>8.1</strong> CoachDog processes personal data in accordance with applicable data protection legislation, including the UK General Data Protection Regulation and the Data Protection Act 2018.
              </p>
              <p className="text-slate-700 mb-3">
                <strong>8.2</strong> By using the Platform, you acknowledge and agree that your personal data will be processed in accordance with our Privacy Policy, which forms part of these Client Terms.
              </p>
              <p className="text-slate-700 mb-3">
                <strong>8.3</strong> Coaches listed on the Platform are independent data controllers in respect of any personal data you provide to them directly in connection with coaching services. CoachDog is not responsible for the processing of personal data by Coaches outside the operation of the Platform.
              </p>
              <p className="text-slate-700">
                <strong>8.4</strong> Where personal data is shared with third-party service providers (including payment processors and hosting providers), such processing is undertaken pursuant to appropriate contractual safeguards.
              </p>
            </section>

            {/* 9. Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
                9. Governing Law
              </h2>
              <p className="text-slate-700 mb-3">
                <strong>9.1</strong> These Client Terms are governed by the laws of England and Wales.
              </p>
              <p className="text-slate-700">
                <strong>9.2</strong> The courts of England and Wales have exclusive jurisdiction.
              </p>
            </section>

            {/* 10. Severance */}
            <section className="mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
                10. Severance
              </h2>
              <p className="text-slate-700 mb-3">
                <strong>10.1</strong> If any provision of these Client Terms is found by a court of competent jurisdiction to be invalid, unlawful, or unenforceable, that provision shall be deemed modified to the minimum extent necessary to make it valid and enforceable.
              </p>
              <p className="text-slate-700">
                <strong>10.2</strong> If such modification is not possible, the relevant provision shall be deemed deleted. Any modification or deletion shall not affect the validity and enforceability of the remaining provisions of these Client Terms.
              </p>
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
          </>
        )}
      </div>
    </div>
  );
};
