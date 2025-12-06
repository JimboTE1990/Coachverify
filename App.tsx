import React, { Component, ErrorInfo, ReactNode } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CoachList } from './pages/CoachList';
import { CoachDetails } from './pages/CoachDetails';
import { CoachDashboard } from './pages/CoachDashboard';
import { CoachSignup } from './pages/CoachSignup';
import { Questionnaire } from './pages/Questionnaire';
import { AdminDashboard } from './pages/Admin';
import { Pricing } from './pages/Pricing';
import { CoachInfo } from './pages/CoachInfo';
import { ClientInfo } from './pages/ClientInfo';
import { Contact } from './pages/Contact';

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
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
          <div className="max-w-md bg-white p-8 rounded-xl shadow-lg border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Something went wrong.</h1>
            <p className="text-slate-500 mb-6">The application encountered an unexpected error. Please try reloading.</p>
            <button 
              onClick={() => {
                localStorage.clear(); // Hard reset for user
                window.location.reload(); 
              }}
              className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700"
            >
              Reset & Reload App
            </button>
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
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<CoachList />} />
            <Route path="/coach/:id" element={<CoachDetails />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/for-coaches" element={<CoachDashboard />} />
            <Route path="/coach-signup" element={<CoachSignup />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/coach-benefits" element={<CoachInfo />} />
            <Route path="/client-benefits" element={<ClientInfo />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
};

export default App;