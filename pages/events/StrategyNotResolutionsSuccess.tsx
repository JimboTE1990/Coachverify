import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Mail, Calendar } from 'lucide-react';

const StrategyNotResolutionsSuccess: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-brand-100 rounded-full p-4">
              <CheckCircle className="h-14 w-14 text-brand-600" />
            </div>
          </div>

          <h1 className="font-display font-extrabold text-3xl text-slate-900 mb-4">
            You're booked in!
          </h1>

          <p className="text-slate-600 text-base leading-relaxed mb-8">
            You've booked onto Strategy, Not Resolutions. Please check your email for your payment receipt.
          </p>

          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-8 text-left flex items-start gap-3">
            <Mail className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 leading-relaxed">
              We'll send the event joining link to your email around 1-2 weeks before the event start date.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-8">
            <Calendar className="h-4 w-4" />
            Wednesday 13 January 2027, 7-9pm UK time
          </div>

          <Link
            to="/"
            className="inline-block w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-md hover:shadow-lg"
          >
            Back to CoachDog
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StrategyNotResolutionsSuccess;
