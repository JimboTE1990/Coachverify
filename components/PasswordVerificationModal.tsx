import React, { useState } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PasswordVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  message?: string;
  email: string;
}

export const PasswordVerificationModal: React.FC<PasswordVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  title = 'Password Required',
  message = 'Please enter your password to continue',
  email,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      // Attempt to sign in with the provided password
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError || !data.user) {
        setError('Incorrect password. Please try again.');
        setIsVerifying(false);
        return;
      }

      // Password is correct
      onVerified();
      setPassword('');
    } catch (err) {
      console.error('Password verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-brand-100 p-2 rounded-lg">
              <Lock className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">Verification required</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-600 mb-6">{message}</p>

        {/* Form */}
        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
              autoFocus
              disabled={isVerifying}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              disabled={isVerifying}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !password}
              className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <p className="text-xs text-slate-500 mt-4 text-center">
          Forgot your password?{' '}
          <a href="/forgot-password" className="text-brand-600 hover:text-brand-700 font-medium">
            Reset it here
          </a>
        </p>
      </div>
    </div>
  );
};
