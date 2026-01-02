import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CoachList } from './pages/CoachList';
import { CoachDetails } from './pages/CoachDetails';
import { CoachDashboard } from './pages/CoachDashboard';
import { CoachLogin } from './pages/CoachLogin';
import { CoachSignup } from './pages/CoachSignup';
import { Questionnaire } from './pages/Questionnaire';
import { AdminDashboard } from './pages/Admin';
import { Pricing } from './pages/Pricing';
import { CoachInfo } from './pages/CoachInfo';
import { ClientInfo } from './pages/ClientInfo';
import { Contact } from './pages/Contact';
import { VerifyEmail } from './pages/VerifyEmail';
import { ResendVerification } from './pages/ResendVerification';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { DebugAuth } from './pages/DebugAuth';
import { CheckoutMonthly } from './pages/checkout/CheckoutMonthly';
import { CheckoutAnnual } from './pages/checkout/CheckoutAnnual';
import { CheckoutSuccess } from './pages/checkout/CheckoutSuccess';
import { ChangePlan } from './pages/subscription/ChangePlan';
import { ChangePlanConfirm } from './pages/subscription/ChangePlanConfirm';
import { ChangePlanSuccess } from './pages/subscription/ChangePlanSuccess';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("==================== ERROR BOUNDARY CAUGHT ERROR ====================");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Component stack:", errorInfo.componentStack);
    console.error("===================================================================");
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
          <div className="max-w-md bg-white p-8 rounded-xl shadow-lg border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Something went wrong.</h1>
            <p className="text-slate-500 mb-6">The application encountered an unexpected error. Please check the browser console (F12) for details.</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
                className="w-full bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700"
              >
                Go to Home Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="w-full bg-slate-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-700"
              >
                Clear Data & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<CoachList />} />
              <Route path="/coach/:id" element={<CoachDetails />} />
              <Route path="/questionnaire" element={<Questionnaire />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/for-coaches" element={<CoachDashboard />} />
              <Route path="/coach-login" element={<CoachLogin />} />
              <Route path="/coach-signup" element={<CoachSignup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/resend-verification" element={<ResendVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/debug-auth" element={<DebugAuth />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/checkout/monthly" element={<CheckoutMonthly />} />
              <Route path="/checkout/annual" element={<CheckoutAnnual />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/subscription/change-plan" element={<ChangePlan />} />
              <Route path="/subscription/change-plan/confirm" element={<ChangePlanConfirm />} />
              <Route path="/subscription/change-plan/success" element={<ChangePlanSuccess />} />
              <Route path="/coach-benefits" element={<CoachInfo />} />
              <Route path="/client-benefits" element={<ClientInfo />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;