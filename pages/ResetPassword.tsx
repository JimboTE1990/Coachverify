import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import { CoachDogFullLogo } from '../components/Layout';
import { validatePassword } from '../utils/passwordValidation';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenExpired, setTokenExpired] = useState(false);

  const passwordStrength = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Check if user has a valid session from password reset email
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // If no session, the reset link might be invalid or expired
      if (!session) {
        setTokenExpired(true);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (passwordStrength.score < 3) {
      setError('Password is not strong enough. Please follow the requirements below.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/for-coaches');
      }, 3000);
    } catch (err: any) {
      if (err.message.includes('session') || err.message.includes('token')) {
        setTokenExpired(true);
      } else {
        setError(err.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <CoachDogFullLogo className="h-16 w-auto" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12">

            {/* Token Expired State */}
            {tokenExpired ? (
              <div className="text-center animate-fade-in">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-10 w-10 text-yellow-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">Link Expired</h1>
                <p className="text-slate-600 mb-8">
                  This password reset link has expired or is invalid.
                  Password reset links are only valid for 10 minutes.
                </p>
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors mb-4"
                >
                  Request New Reset Link
                </button>
                <button
                  onClick={() => navigate('/for-coaches')}
                  className="text-slate-600 hover:text-brand-600 font-medium text-sm"
                >
                  Back to Login
                </button>
              </div>
            ) : success ? (
              /* Success State */
              <div className="text-center animate-fade-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">
                  Password Reset Successful!
                </h1>
                <p className="text-slate-600 mb-6">
                  Your password has been successfully updated.
                </p>
                <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                  <p className="text-brand-800 text-sm font-medium">
                    Redirecting you to login...
                  </p>
                </div>
              </div>
            ) : (
              /* Reset Password Form */
              <>
                {/* Icon */}
                <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="h-10 w-10 text-brand-600" />
                </div>

                {/* Header */}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 text-center">
                  Set New Password
                </h1>
                <p className="text-slate-600 text-center mb-8">
                  Enter your new password below. Make sure it's strong and unique.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="mt-3 animate-fade-in">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-600">Password Strength</span>
                          <span className="text-xs font-bold" style={{ color: passwordStrength.color }}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-300 rounded-full"
                            style={{
                              width: `${(passwordStrength.score / 5) * 100}%`,
                              backgroundColor: passwordStrength.color,
                            }}
                          />
                        </div>

                        {/* Requirements */}
                        {passwordStrength.errors.length > 0 && (
                          <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <p className="text-xs font-semibold text-slate-700 mb-2">Requirements:</p>
                            <ul className="space-y-1">
                              {passwordStrength.errors.map((err, i) => (
                                <li key={i} className="text-xs text-slate-600 flex items-start">
                                  <XCircle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0 text-red-500" />
                                  {err}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Match Indicator */}
                    {confirmPassword && (
                      <div className="mt-2 flex items-center animate-fade-in">
                        {passwordsMatch ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            <span className="text-xs font-medium text-green-600">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2 text-red-500" />
                            <span className="text-xs font-medium text-red-500">Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-start">
                      <XCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || passwordStrength.score < 3 || !passwordsMatch}
                    className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin mr-2" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>

                  {/* Security Tip */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-900 text-xs font-semibold mb-1">Security tip:</p>
                    <p className="text-blue-800 text-xs">
                      Use a unique password that you haven't used before. Consider using a password manager.
                    </p>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-8">
          Need help? Contact support@coachdog.co.uk
        </p>
      </div>
    </div>
  );
};
