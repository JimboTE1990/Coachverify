import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Database, UserCheck, Trash2, FileText, Globe, AlertTriangle } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 md:p-12">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-500 font-medium">CoachDog Ltd</p>
          <p className="text-slate-500 text-sm mt-1">Last Updated: 26 February 2026</p>
        </div>

        <p className="text-slate-700 mb-4">
          This Privacy Policy explains how CoachDog Ltd (<strong>"CoachDog"</strong>, <strong>"we"</strong>, <strong>"us"</strong>, <strong>"our"</strong>) collects, uses, discloses, and protects your personal data when you visit our website, interact with our platform, or use the CoachDog platform (the <strong>"Platform"</strong>).
        </p>
        <p className="text-slate-700 mb-8">
          We are committed to protecting your privacy and handling your personal data openly and transparently.
        </p>

        {/* Data Controller */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <UserCheck className="h-6 w-6 mr-3 text-brand-600" />
            Data Controller Details
          </h2>
          <p className="text-slate-700 mb-3">
            CoachDog Ltd is a company incorporated in England and Wales with its registered office at [Registered Office Address]. For the purposes of the UK General Data Protection Regulation (<strong>"UK GDPR"</strong>), the Data Protection Act 2018, and the Data (Use and Access) Act 2025, CoachDog Ltd is the <strong>Data Controller</strong> in respect of all personal data processed by us via the Platform.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-slate-700">
            <p className="font-medium">CoachDog Ltd</p>
            <p>Email: <a href="mailto:legal@coachdog.co.uk" className="text-brand-600 hover:underline">legal@coachdog.co.uk</a></p>
          </div>
        </section>

        {/* Scope */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">1. Scope and Application</h2>
          <p className="text-slate-700 mb-3">This Privacy Policy applies to the following categories of individuals (referred to as "you" or "your"):</p>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc mb-4">
            <li><strong>Visitors:</strong> Individuals who browse our website or Platform;</li>
            <li><strong>Clients:</strong> Individuals seeking or engaging coaching services through the Platform;</li>
            <li><strong>Coaches:</strong> Individuals or entities who subscribe to the Platform to offer coaching services and receive client introductions.</li>
          </ul>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-bold text-amber-900 mb-1">Important Distinction for Coaches</p>
            <p className="text-amber-800 text-sm">
              This Privacy Policy does <strong>not apply</strong> to personal data that Coaches collect, use, or process independently from their clients in the course of delivering professional coaching services. In respect of such data, Coaches act as <strong>separate and independent Data Controllers</strong> in their own right. Coaches are solely responsible for providing their own privacy notices to their clients, obtaining any necessary consents, and complying with all applicable data protection laws. CoachDog assumes no liability for Coaches' independent processing activities.
            </p>
          </div>
        </section>

        {/* Data Categories */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <Database className="h-6 w-6 mr-3 text-brand-600" />
            2. Categories of Personal Data We Collect
          </h2>
          <p className="text-slate-700 mb-4">We may collect, use, store, and transfer different kinds of personal data about you, grouped as follows:</p>

          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">2.1 Identity Data</h4>
              <ul className="ml-4 list-disc space-y-1 text-slate-700 text-sm">
                <li>Full name;</li>
                <li>Professional title, role, or occupation;</li>
                <li>Accreditation details, professional memberships, and qualifications (specifically for Coaches);</li>
                <li>Photographs or profile images (if voluntarily uploaded).</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">2.2 Contact Data</h4>
              <ul className="ml-4 list-disc space-y-1 text-slate-700 text-sm">
                <li>Email address;</li>
                <li>Account login credentials (username and encrypted password);</li>
                <li>Social media handles or website URLs (where voluntarily provided by Coaches for lead generation purposes).</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">2.3 Technical Data</h4>
              <ul className="ml-4 list-disc space-y-1 text-slate-700 text-sm">
                <li>Internet Protocol (IP) address;</li>
                <li>Browser type and version;</li>
                <li>Device type, operating system, and unique device identifiers;</li>
                <li>Time zone setting and location data (where permitted by your device settings);</li>
                <li>Log data, including pages accessed, referral URLs, and clickstream data.</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">2.4 Usage Data</h4>
              <ul className="ml-4 list-disc space-y-1 text-slate-700 text-sm">
                <li>Information about how you use the Platform, including features accessed, time spent, and interactions with other users;</li>
                <li>Availability status ("Accepting Clients", "Limited Spaces", "Not Accepting Clients") set by Coaches;</li>
                <li>Responses to match suggestions or algorithm-driven features.</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">2.5 Payment Data</h4>
              <ul className="ml-4 list-disc space-y-1 text-slate-700 text-sm">
                <li>Billing address and transaction records;</li>
                <li>Subscription history and invoice details.</li>
              </ul>
              <p className="text-slate-700 text-sm mt-2">
                <strong>Sensitive Payment Information:</strong> Full payment card details (Primary Account Number, expiry date, CVV) are <strong>not stored</strong> by CoachDog. Such data is processed directly and securely by our third-party payment processor, <strong>Stripe Payments Europe Ltd</strong>, in accordance with the Payment Card Industry Data Security Standard (PCI DSS).
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-2">2.6 Marketing and Communications Data</h4>
              <ul className="ml-4 list-disc space-y-1 text-slate-700 text-sm">
                <li>Your preferences in receiving marketing communications from us;</li>
                <li>Records of your correspondence with us, including enquiries and support requests.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Lawful Basis */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <FileText className="h-6 w-6 mr-3 text-brand-600" />
            3. Lawful Basis for Processing
          </h2>
          <p className="text-slate-700 mb-4">Under UK GDPR, we are required to have a valid lawful basis for processing your personal data. We process your data on the following bases:</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-bold text-slate-900 w-1/3">Purpose of Processing</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-900 w-1/4">Lawful Basis</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-900">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Account creation, registration, and platform access', 'Contractual Necessity', 'Processing is necessary to perform our contract with you, allowing you to set up a profile and access the Platform.'],
                  ['Subscription fee processing and billing', 'Contractual Necessity', 'Required to process payments, manage subscriptions, and fulfil our obligations under the agreement.'],
                  ['Platform security, fraud prevention, and misuse detection', 'Legitimate Interests', 'It is in our legitimate interests to ensure the security and integrity of the Platform, prevent fraudulent activity, and protect our users and business.'],
                  ['Verification of Coach accreditation and professional status', 'Legitimate Interests', 'It is in our legitimate interests to maintain trust in the Platform by taking reasonable steps to verify the professional standing of Coaches.'],
                  ['Compliance with legal and regulatory obligations', 'Legal Obligation', 'Processing is necessary to comply with applicable laws and regulations.'],
                  ['Responding to enquiries and providing customer support', 'Legitimate Interests', 'It is in our legitimate interests to assist you and resolve any issues you may encounter.'],
                  ['Sending service-related communications', 'Contractual Necessity / Legitimate Interests', 'Required to keep you informed about important changes to the service or your account.'],
                  ['Sending marketing communications (where applicable)', 'Consent', 'We will only send you direct marketing communications if you have provided your explicit consent. You have the right to withdraw consent at any time.'],
                  ['Improving and developing the Platform (including analytics)', 'Legitimate Interests', 'It is in our legitimate interests to analyse usage, fix bugs, and enhance the user experience. We ensure such processing is balanced against your rights.'],
                ].map(([purpose, basis, explanation], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-3 align-top">{purpose}</td>
                    <td className="px-4 py-3 align-top font-semibold text-slate-900">{basis}</td>
                    <td className="px-4 py-3 align-top">{explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 text-sm mt-3">
            <strong>Legitimate Interests Assessment (LIA):</strong> Where we rely on legitimate interests, we have conducted a balancing test to ensure that our interests do not override your fundamental rights and freedoms. You have the right to object to processing based on legitimate interests (see Section 9).
          </p>
        </section>

        {/* How We Use Data */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">4. How We Use Your Personal Data</h2>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc mb-4">
            <li><strong>To provide and administer the Platform:</strong> Facilitating account creation, profile management, and core functionality, including the availability indicator feature (e.g., "Accepting Clients" status).</li>
            <li><strong>To verify Coach accreditation:</strong> Taking reasonable steps to confirm the professional credentials of Coaches to maintain platform integrity.</li>
            <li><strong>To process subscriptions and payments:</strong> Managing billing, invoicing, and payment transactions via our third-party payment processor.</li>
            <li><strong>To maintain platform security:</strong> Monitoring for unauthorised access, fraud, misuse, or technical issues.</li>
            <li><strong>To communicate with you:</strong> Sending service updates, responding to enquiries, and providing customer support.</li>
            <li><strong>To comply with legal obligations:</strong> Retaining records as required by law and responding to lawful requests from regulators or law enforcement.</li>
            <li><strong>To improve the Platform:</strong> Analysing usage patterns to enhance functionality, user experience, and matching algorithms.</li>
            <li><strong>To prevent fraud and misuse:</strong> Detecting and preventing activity that breaches our Terms of Use or violates applicable law.</li>
          </ul>
          <div className="bg-slate-50 rounded-xl p-4 mb-3">
            <p className="text-slate-700 text-sm"><strong>Automated Decision-Making:</strong> We do <strong>not</strong> use automated decision-making (including profiling) that produces legal effects concerning you or similarly significantly affects you. Our matching algorithms are for informational and lead generation purposes only and do not constitute automated decision-making as defined under UK GDPR.</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-700 text-sm"><strong>Sale of Data:</strong> We do <strong>not sell</strong> your personal data to any third party for marketing or commercial purposes.</p>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-3 text-brand-600" />
            5. Data Sharing and Disclosures
          </h2>
          <p className="text-slate-700 mb-4">We may share your personal data with the following categories of third parties, where necessary for the purposes set out in this Privacy Policy:</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
            <table className="w-full text-sm text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-bold text-slate-900">Recipient Category</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-900">Purpose of Sharing</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-900">Safeguards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Stripe Payments Europe Ltd', 'Payment processing, subscription billing, fraud prevention.', "Stripe acts as a Data Processor. Data is transferred subject to Stripe's binding terms and security certifications (PCI DSS)."],
                  ['Cloud hosting providers (e.g., AWS, Azure)', 'Platform hosting, data storage, infrastructure maintenance.', 'Processors are contractually bound to implement appropriate security measures and process data only on our documented instructions.'],
                  ['IT and analytics service providers', 'Platform analytics, performance monitoring, error tracking.', 'Processors operate under strict data processing agreements compliant with UK GDPR Article 28.'],
                  ['Professional advisers (legal, accounting, insurance)', 'Obtaining professional advice, managing disputes, compliance.', 'Advisers are subject to professional confidentiality obligations.'],
                  ['Regulators, courts, or law enforcement', 'Complying with legal obligations, court orders, or regulatory requests.', 'Disclosures are limited to what is legally required and proportionate.'],
                  ['Business transferees (merger, acquisition, or sale)', 'Facilitating corporate transactions (as permitted under our Terms).', 'The recipient will be bound by obligations of confidentiality and data protection.'],
                ].map(([recipient, purpose, safeguards], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-3 align-top font-semibold text-slate-900">{recipient}</td>
                    <td className="px-4 py-3 align-top">{purpose}</td>
                    <td className="px-4 py-3 align-top">{safeguards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 text-sm">
            <strong>All third-party processors</strong> are subject to written contracts imposing strict data protection obligations, ensuring they process data only on our documented instructions and maintain appropriate security measures.
          </p>
        </section>

        {/* International Transfers */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <Globe className="h-6 w-6 mr-3 text-brand-600" />
            6. International Transfers
          </h2>
          <p className="text-slate-700 mb-3">
            Your personal data may be transferred to, and processed in, countries outside the United Kingdom. Where we transfer your personal data to a country that is not subject to an adequacy decision by the UK Government, we ensure appropriate safeguards are implemented, including:
          </p>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc mb-3">
            <li>The <strong>UK International Data Transfer Agreement (IDTA)</strong> or <strong>UK Addendum to the EU Standard Contractual Clauses</strong>; or</li>
            <li>Other legally recognised transfer mechanisms under UK GDPR.</li>
          </ul>
          <p className="text-slate-600 text-sm">
            You have the right to request a copy of the relevant safeguards by contacting us at{' '}
            <a href="mailto:legal@coachdog.co.uk" className="text-brand-600 hover:underline">legal@coachdog.co.uk</a>.
          </p>
        </section>

        {/* Data Retention */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">7. Data Retention</h2>
          <p className="text-slate-700 mb-4">We retain your personal data only for as long as reasonably necessary to fulfil the purposes for which it was collected:</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
            <table className="w-full text-sm text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-bold text-slate-900">Data Category</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-900">Retention Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Account data (active users)', 'Retained for the duration of your account + a reasonable period to allow for reactivation.'],
                  ['Financial / transaction data', 'Retained for 6 years + current year to comply with HMRC requirements.'],
                  ['Correspondence and support tickets', 'Retained for 2 years from resolution.'],
                  ['Technical logs and usage data', 'Retained for up to 12 months for security and analytics purposes.'],
                  ['Inactive / cancelled accounts', 'Accounts with no activity for 12 months may be deleted. You will be notified prior to deletion where possible.'],
                ].map(([category, period], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-3 align-top font-semibold text-slate-900">{category}</td>
                    <td className="px-4 py-3 align-top">{period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 text-sm">When personal data is no longer required, it is securely deleted or anonymised (rendering it non-identifiable).</p>
        </section>

        {/* Security */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <Lock className="h-6 w-6 mr-3 text-brand-600" />
            8. Data Security
          </h2>
          <p className="text-slate-700 mb-4">We have implemented appropriate technical and organisational measures to protect your personal data from unauthorised access, disclosure, accidental loss, destruction, or damage.</p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {[
              ['Encryption', 'Data is encrypted in transit (TLS) and at rest (AES-256).'],
              ['Access Controls', 'Strict role-based access, limiting data access to authorised personnel on a need-to-know basis.'],
              ['Regular Testing', 'We regularly test our systems and processes for vulnerabilities.'],
              ['Incident Response', 'We have a breach response plan to address and report personal data breaches to the ICO and affected individuals within 72 hours where required.'],
            ].map(([title, desc], i) => (
              <div key={i} className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-bold text-green-900 mb-1">{title}</h4>
                <p className="text-green-800 text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-600 text-sm">While we implement robust security measures, no method of transmission over the internet or electronic storage is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.</p>
        </section>

        {/* GDPR Rights */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <UserCheck className="h-6 w-6 mr-3 text-brand-600" />
            9. Your Rights Under UK GDPR
          </h2>
          <p className="text-slate-700 mb-4">As a data subject, you have the following legal rights regarding your personal data:</p>
          <div className="space-y-3 mb-4">
            {[
              ['Right to be Informed', 'You have the right to be provided with clear, transparent information about how we use your data (this Privacy Policy fulfils that right).'],
              ['Right of Access', 'You may request access to your personal data (a "subject access request"), allowing you to receive a copy of the data we hold and verify we are processing it lawfully.'],
              ['Right to Rectification', 'You may request correction of any incomplete or inaccurate data we hold.'],
              ['Right to Erasure ("Right to be Forgotten")', 'You may request deletion of your personal data where there is no compelling reason for continued processing. This right is not absolute and applies only in specific circumstances.'],
              ['Right to Restriction of Processing', 'You may request we suspend the processing of your data in certain scenarios (e.g., while verifying its accuracy).'],
              ['Right to Data Portability', 'You may request transfer of your data to you or a third party in a structured, machine-readable format (applies only to data processed by automated means based on consent or contract).'],
              ['Right to Object', 'You may object to processing based on legitimate interests (including profiling) or direct marketing. We will cease processing unless we demonstrate compelling legitimate grounds.'],
              ['Right to Withdraw Consent', 'Where processing is based on consent, you may withdraw consent at any time. Withdrawal does not affect the lawfulness of processing before withdrawal.'],
              ['Right to Lodge a Complaint', 'You have the right to lodge a complaint with the Information Commissioner\'s Office (ICO) if you are dissatisfied with our handling of your data.'],
            ].map(([right, desc], i) => (
              <div key={i} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-900 mb-1">{right}</h4>
                <p className="text-blue-800 text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
            <p className="font-bold text-slate-900 mb-2">How to Exercise Your Rights</p>
            <p className="text-slate-700 text-sm mb-2">To exercise any of your rights, please submit a request to: <a href="mailto:legal@coachdog.co.uk" className="text-brand-600 hover:underline font-medium">legal@coachdog.co.uk</a></p>
            <ul className="ml-4 list-disc space-y-1 text-slate-600 text-sm">
              <li><strong>Identity Verification:</strong> We may require proof of identity before processing your request.</li>
              <li><strong>Response Timeframe:</strong> We will respond to all legitimate requests within one month. This may be extended by a further two months if the request is complex; we will notify you if this applies.</li>
              <li><strong>No Fee Usually Required:</strong> You will not normally have to pay a fee to exercise your rights, unless your request is clearly unfounded, repetitive, or excessive.</li>
            </ul>
          </div>
        </section>

        {/* Complaints */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-3 text-brand-600" />
            10. Complaints
          </h2>
          <p className="text-slate-700 mb-4">
            If you are concerned about our handling of your personal data, you have the right to lodge a complaint with the UK supervisory authority:
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <p className="font-bold text-slate-900">Information Commissioner's Office (ICO)</p>
            <p className="text-slate-700 text-sm">Website: <a href="https://www.ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">www.ico.org.uk</a></p>
            <p className="text-slate-700 text-sm">Telephone: 0303 123 1113</p>
          </div>
          <p className="text-slate-600 text-sm">
            We would, however, appreciate the opportunity to address your concerns before you approach the ICO. Please contact us first at{' '}
            <a href="mailto:legal@coachdog.co.uk" className="text-brand-600 hover:underline">legal@coachdog.co.uk</a>{' '}
            and we will do our utmost to resolve the matter.
          </p>
        </section>

        {/* Changes */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">11. Changes to This Privacy Policy</h2>
          <p className="text-slate-700 mb-3">
            We keep this Privacy Policy under regular review and may update it from time to time to reflect changes in our practices, legal obligations, or the regulatory landscape (including updates under the Data (Use and Access) Act 2025).
          </p>
          <ul className="space-y-2 text-slate-700 ml-6 list-disc">
            <li><strong>Material changes:</strong> Where we make significant changes, we will notify you by email or through a prominent notice on the Platform.</li>
            <li><strong>Non-material changes:</strong> The updated version will be posted on the Platform with a revised "Last Updated" date.</li>
          </ul>
          <p className="text-slate-600 text-sm mt-3">
            Your continued use of the Platform after the effective date of any changes constitutes acceptance of the updated terms.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">12. Contact Us</h2>
          <p className="text-slate-700 mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data protection practices, please contact our Data Protection Lead:
          </p>
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-6">
            <p className="text-slate-900 font-bold mb-1">CoachDog Ltd</p>
            <p className="text-slate-700">
              Email:{' '}
              <a href="mailto:legal@coachdog.co.uk" className="text-brand-600 hover:underline font-medium">
                legal@coachdog.co.uk
              </a>
            </p>
          </div>
          <p className="text-slate-600 text-sm mt-3">
            We are here to help and will respond to all legitimate enquiries as promptly as possible.
          </p>
        </section>

        {/* Footer */}
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
