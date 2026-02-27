import React from 'react';
import { Link } from 'react-router-dom';

export const CoachSubscriptionAgreement: React.FC = () => {
  return (
    <>
      {/* Introduction */}
      <section className="mb-8">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-6">
          COACHDOG COACH SUBSCRIPTION AGREEMENT
        </h2>
        <p className="text-slate-700 mb-4">
          Last updated: XX February 2026
        </p>
        <p className="text-slate-700">
          This Agreement forms a legally binding contract between CoachDog Ltd and the subscribing Coach, the 'Coach'.
        </p>
      </section>

      {/* 1. Subscription Fees and Payment Terms */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          1. Subscription Fees and Payment Terms
        </h2>

        <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">1.1. Subscription Fee</h3>
        <p className="text-slate-700 mb-4">
          In consideration of the right to access and use the Services provided by CoachDog under this Agreement, the Coach shall pay CoachDog a monthly subscription fee of £15.00 (Fifteen Pounds Sterling) (hereinafter referred to as the "Subscription Fee").
        </p>

        <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">1.2. Payment Schedule</h3>
        <p className="text-slate-700 mb-4">
          The Subscription Fee shall be payable by the Coach to CoachDog monthly in advance.
        </p>

        <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">1.3. Value Added Tax (VAT)</h3>
        <p className="text-slate-700 mb-4">
          All fees stated in this Agreement are exclusive of any Value Added Tax or other similar sales taxes (together "VAT"). If VAT is chargeable by CoachDog in respect of any services provided to the Coach, the Coach shall pay the amount of such VAT (at the applicable rate) in addition to the Subscription Fee, upon receipt of a valid VAT invoice.
        </p>

        <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">1.4. Non-Refundable Nature of Fees</h3>
        <p className="text-slate-700 mb-4">
          The Coach acknowledges and agrees that all Subscription Fees paid or payable under this Agreement are non-refundable. CoachDog shall not provide any refunds or credits for partial months of service, downgrades, or for months where the Coach did not use the Services, except as expressly provided otherwise in this Agreement or required by applicable law.
        </p>

        <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">1.5. Fee Variations</h3>
        <p className="text-slate-700 mb-4">
          CoachDog reserves the right to review and vary the Subscription Fee upon not less than 30 (thirty) days' prior written notice to the Coach (which may be provided via email). Should CoachDog exercise this right, the revised Subscription Fee shall become effective at the start of the next billing cycle following the expiry of the 30-day notice period. If the Coach does not agree to such revised fees, the Coach's sole remedy shall be to terminate this Agreement prior to the effective date of the fee increase.
        </p>
      </section>

      {/* 2. Trial Period */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          2. Trial Period and Account Activation
        </h2>

        <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">2.1. Trial Period</h3>
        <p className="text-slate-700 mb-4">
          CoachDog may, at its sole discretion, offer the Coach a one-time, non-renewable trial period of 30 (thirty) consecutive days (the "Trial Period") commencing on the date of account registration. The purpose of the Trial Period is to allow the Coach to evaluate the Services prior to entering into a paid subscription.
        </p>

        <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">2.2. Trial Activation</h3>
        <p className="text-slate-700 mb-4">
          To activate the Trial Period, the Coach is not required to provide payment card details or any other form of payment mechanism at the point of signup. Access to the Services during the Trial Period is contingent upon the Coach's acceptance of this Agreement and registration of a valid account.
        </p>

        <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">2.3. Conversion to Paid Subscription</h3>
        <p className="text-slate-700 mb-4">
          Following the conclusion of the Trial Period, continued access to and use of the Services shall require the Coach to enter into a paid subscription. To convert to a paid subscription, the Coach must provide valid and current payment card details via the account settings portal.
        </p>

        <h3 className="text-xl font-bold text-slate-900 mb-3 mt-6">2.4. Limitation to One Trial</h3>
        <p className="text-slate-700 mb-4">
          The Trial Period is strictly limited to one (1) per individual Coach. If CoachDog determines that the Coach has registered for, or attempted to register for, more than one Trial Period, CoachDog reserves the right to void the Trial Period and immediately terminate this Agreement.
        </p>
      </section>

      {/* 3. Payment Processing */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          3. Payment Processing and Third-Party Services
        </h2>

        <p className="text-slate-700 mb-4">
          All monetary transactions under this Agreement, including the collection of Subscription Fees and the processing of payment card data, shall be handled by Stripe Payments Europe Ltd. ("Stripe"), a third-party payment processor. CoachDog does not store full payment card details on its servers.
        </p>
      </section>

      {/* 4. Independent Professional Status */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          4. Independent Professional Status and Coach Responsibilities
        </h2>

        <p className="text-slate-700 mb-4">
          The Coach enters into this Agreement as an independent professional, and not as an employee, agent, or partner of CoachDog. The Coach is solely responsible for all coaching services, advice, and interactions provided to clients.
        </p>

        <p className="text-slate-700 mb-4">
          The Coach represents and warrants that they hold and maintain valid accreditation from a recognised professional coaching body (EMCC, ICF, or Association for Coaching) and shall promptly notify CoachDog if their accreditation lapses or is suspended.
        </p>
      </section>

      {/* 5. Professional Conduct */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          5. Professional Conduct and Regulatory Protection
        </h2>

        <p className="text-slate-700 mb-4">
          The Coach warrants that they shall not represent that CoachDog is a regulatory authority or professional body. The Coach expressly warrants that they shall not provide any services that constitute the practice of medicine, psychiatry, psychology, psychotherapy, legal advice, or any other regulated profession unless properly licensed.
        </p>
      </section>

      {/* 6. Lead Generation */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          6. Lead Generation and Introduction Services
        </h2>

        <p className="text-slate-700 mb-4">
          CoachDog operates as a marketing and lead generation platform. CoachDog's role is limited to promoting the Coach's professional profile and facilitating introductions between the Coach and potential clients. CoachDog does not process payments or manage bookings between coaches and clients.
        </p>

        <p className="text-slate-700 mb-4">
          The Coach retains full ownership of their client relationships and is free to engage with introduced clients on whatever terms they mutually agree. The Coach acknowledges that the value of the subscription is in the marketing exposure and lead generation provided by CoachDog.
        </p>
      </section>

      {/* 7. Indemnity */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          7. Indemnity
        </h2>

        <p className="text-slate-700 mb-4">
          The Coach agrees to indemnify, defend, and hold harmless CoachDog from any claims, damages, or liabilities arising from:
        </p>
        <ul className="space-y-2 text-slate-700 ml-6 list-disc mb-4">
          <li>Coaching services delivered by the Coach</li>
          <li>Misrepresentation of qualifications or credentials</li>
          <li>Accreditation lapse or failure to maintain valid accreditation</li>
          <li>Breach of applicable laws or regulations</li>
          <li>Data protection violations</li>
        </ul>
      </section>

      {/* 8. Insurance */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          8. Insurance Obligations
        </h2>

        <p className="text-slate-700 mb-4">
          The Coach warrants that throughout the term of this Agreement, they shall maintain professional indemnity insurance with coverage limits of not less than £1,000,000 per claim. The Coach shall provide proof of insurance upon request within 7 business days.
        </p>
      </section>

      {/* 9. Limitation of Liability */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          9. Limitation of Liability
        </h2>

        <p className="text-slate-700 mb-4">
          Subject to statutory exceptions, CoachDog's total aggregate liability shall be limited to the total Subscription Fees paid in the 12 months preceding the claim.
        </p>

        <p className="text-slate-700 mb-4">
          CoachDog shall not be liable for loss of clients, loss of revenue, damage to reputation, or any indirect or consequential losses.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
          <p className="text-sm text-amber-900">
            <strong>Important:</strong> Nothing in this Agreement excludes liability for death or personal injury caused by negligence, fraud, or any liability that cannot be excluded under the Consumer Rights Act 2015.
          </p>
        </div>
      </section>

      {/* 10. Termination */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          10. Termination Rights
        </h2>

        <p className="text-slate-700 mb-4">
          CoachDog may terminate this Agreement immediately for fraud, accreditation revocation, reputational risk, regulatory inquiry, or material breach.
        </p>

        <p className="text-slate-700 mb-4">
          The Coach may terminate at any time through the account settings dashboard. Access will continue for the remainder of the current paid period. No refunds will be provided for unused subscription time.
        </p>
      </section>

      {/* 11. Algorithm Disclaimer */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          11. Algorithm and Matching Disclaimer
        </h2>

        <p className="text-slate-700 mb-4">
          The Platform utilises automated matching algorithms based solely on information provided by users. All matching is fully automated without human intervention. CoachDog makes no representations regarding the suitability, accuracy, or success of any matches generated.
        </p>

        <p className="text-slate-700 mb-4">
          CoachDog verifies the Coach's name and accreditation numbers with public records of the ICF, EMCC, and Association for Coaching only. No other vetting, screening, or assessment is conducted.
        </p>
      </section>

      {/* 12. Force Majeure */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          12. Force Majeure
        </h2>

        <p className="text-slate-700 mb-4">
          CoachDog shall not be liable for failure to perform obligations due to events beyond its reasonable control, including acts of God, natural disasters, war, terrorism, government actions, strikes, or failures of third-party systems.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
          Contact Information
        </h2>
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-6">
          <p className="text-slate-900 font-medium mb-2">CoachDog Legal Team</p>
          <p className="text-slate-700 mb-1">
            <strong>Email:</strong>{' '}
            <a href="mailto:legal@coachdog.co.uk" className="text-brand-600 hover:underline">
              legal@coachdog.co.uk
            </a>
          </p>
          <p className="text-slate-700">
            <strong>Support:</strong>{' '}
            <a href="mailto:support@coachdog.co.uk" className="text-brand-600 hover:underline">
              support@coachdog.co.uk
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="pt-8 border-t border-slate-200 text-center">
        <p className="text-slate-600 mb-4">
          By subscribing to CoachDog, you agree to this Coach Subscription Agreement and our{' '}
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
  );
};
