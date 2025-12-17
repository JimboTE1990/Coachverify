import React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const ChangePlanSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fromPlan = searchParams.get('from') || 'monthly';
  const toPlan = searchParams.get('to') || 'annual';
  const effectiveDate = searchParams.get('date') || '20 December 2025';

  const plans = {
    monthly: { price: '£15', period: '/mo' },
    annual: { price: '£150', period: '/yr' }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 p-12 shadow-xl text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-display font-bold text-slate-900 mb-3">
          Your plan change is scheduled
        </h1>

        <p className="text-slate-600 mb-8 text-lg">
          Your payment method has been verified, and your plan will change to {toPlan === 'annual' ? 'Annual' : 'Monthly'} on {effectiveDate}.
        </p>

        <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left">
          <div className="space-y-3 text-slate-700">
            <div className="flex justify-between">
              <span>Current Status:</span>
              <span className="font-bold">
                {fromPlan === 'monthly' ? 'Monthly' : 'Annual'} {plans[fromPlan as keyof typeof plans]?.price}{plans[fromPlan as keyof typeof plans]?.period}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Scheduled Change:</span>
              <span className="font-bold text-brand-600">
                {toPlan === 'annual' ? 'Annual' : 'Monthly'} {plans[toPlan as keyof typeof plans]?.price}{plans[toPlan as keyof typeof plans]?.period} on {effectiveDate}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800">
          You can cancel this change anytime before {effectiveDate} from your dashboard.
        </div>

        <div className="flex gap-4">
          <Link
            to="/for-coaches?tab=subscription"
            className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Manage Subscription
          </Link>
          <button
            onClick={() => navigate('/for-coaches')}
            className="flex-1 bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-colors flex items-center justify-center"
          >
            Go to Dashboard <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};
