import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle, ArrowRight, Loader, Mail, AlertTriangle, Eye, EyeOff, XCircle } from 'lucide-react';
import { verifyCoachLicense } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../utils/passwordValidation';
import { createCoachProfile } from '../utils/profileCreation';
import { withTimeout } from '../utils/promiseTimeout';
import { useAuth } from '../hooks/useAuth';

export const CoachSignup: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [ageError, setAgeError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const hasRedirected = useRef(false);

  // Redirect if already logged in (wait for auth to finish loading)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasRedirected.current) {
      console.log('[CoachSignup] User already logged in, redirecting to dashboard');
      hasRedirected.current = true;
      navigate('/for-coaches', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    dobDay: '1',
    dobMonth: '0',
    dobYear: '2000',
    body: 'EMCC',
    regNumber: '',
  });

  const passwordStrength = validatePassword(formData.password);
  const fullName = `${formData.first_name} ${formData.last_name}`.trim();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name.startsWith('dob')) setAgeError('');
    if (e.target.name === 'password') setSignupError('');
  };

  const checkAge = () => {
    const today = new Date();
    const birthDate = new Date(
      parseInt(formData.dobYear),
      parseInt(formData.dobMonth),
      parseInt(formData.dobDay)
    );

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < 18) {
        setAgeError('You must be at least 18 years old to register as a coach.');
        return false;
    }
    return true;
  };

  const checkDuplicateEmail = async (): Promise<boolean> => {
    setSignupError('');
    setCheckingEmail(true);

    try {
      console.log('[CoachSignup] Checking if email already exists:', formData.email);

      // Check both auth.users (via coaches table) and coaches table
      const { data: existingCoach, error: checkError } = await withTimeout(
        supabase
          .from('coaches')
          .select('email')
          .eq('email', formData.email)
          .maybeSingle(),
        10000, // 10 second timeout for validation check
        'Email validation timed out. Please try again.'
      );

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (email available)
        console.error('[CoachSignup] Error checking email:', checkError);
        setSignupError('Could not validate email. Please try again.');
        return false;
      }

      if (existingCoach) {
        console.log('[CoachSignup] Email already exists in database');
        setSignupError(
          'An account with this email already exists. Please use the "Forgot Password" link on the login page, or contact support@coachdog.com if you need help accessing your account.'
        );
        return false;
      }

      console.log('[CoachSignup] Email is available');
      return true;

    } catch (error: any) {
      console.error('[CoachSignup] Duplicate email check failed:', error);
      setSignupError(
        error.message || 'Could not validate email. Please check your connection and try again.'
      );
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleStep1Submit = async () => {
    setSignupError('');

    // Validate password strength
    if (passwordStrength.score < 3) {
      setSignupError('Password is not strong enough. Please follow the requirements below.');
      return;
    }

    // Check for duplicate email BEFORE age check
    const emailAvailable = await checkDuplicateEmail();
    if (!emailAvailable) {
      return; // Error already set by checkDuplicateEmail
    }

    // Check age
    if (checkAge()) {
        setStep(2);
    }
  };

  const handleVerification = async () => {
    setLoading(true);
    const isValid = await verifyCoachLicense(formData.body, formData.regNumber);
    setLoading(false);
    if (isValid) {
      setVerified(true);
    } else {
      alert("Could not verify license. Please check your number.");
    }
  };

  const handleCompleteSignup = async () => {
    setLoading(true);
    setSignupError('');

    try {
      console.log('[CoachSignup] Starting signup process...');
      console.log('[CoachSignup] Email:', formData.email);
      console.log('[CoachSignup] Redirect URL:', `${window.location.origin}/verify-email`);

      // Email already validated in Step 1, proceeding with signup
      console.log('[CoachSignup] Email already validated in Step 1, proceeding with signup...');

      // Create user in Supabase Auth with email confirmation required
      // Wrapped with timeout to prevent infinite loading if network hangs
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/verify-email`,
            data: {
              full_name: fullName,
              first_name: formData.first_name,
              last_name: formData.last_name,
              date_of_birth: `${formData.dobYear}-${formData.dobMonth.padStart(2, '0')}-${formData.dobDay.padStart(2, '0')}`,
              accreditation_body: formData.body,
              registration_number: formData.regNumber,
            },
          },
        }),
        30000, // 30 second timeout
        'Signup request timed out. Please check your connection and try again.'
      );

      console.log('[CoachSignup] Signup response:', {
        user: authData?.user?.id,
        email: authData?.user?.email,
        email_confirmed: authData?.user?.email_confirmed_at,
        session: !!authData?.session,
        error: authError,
        full_auth_data: authData
      });

      if (authError) {
        console.error('[CoachSignup] Auth error:', authError);
        console.error('[CoachSignup] Error code:', authError.code);
        console.error('[CoachSignup] Error message:', authError.message);

        // Check for duplicate email error from Supabase
        if (authError.message && (
          authError.message.toLowerCase().includes('already') ||
          authError.message.toLowerCase().includes('duplicate') ||
          authError.message.toLowerCase().includes('exists') ||
          authError.code === '23505' // PostgreSQL unique violation
        )) {
          setSignupError('An account with this email already exists. Please log in or use a different email. If you believe this is an error, please contact support@coachdog.com');
          setLoading(false);
          return;
        }

        throw authError;
      }

      if (!authData.user) {
        console.error('[CoachSignup] No user returned from signup');
        throw new Error('Signup failed - no user returned');
      }

      console.log('[CoachSignup] User created successfully:', authData.user.id);
      console.log('[CoachSignup] Email confirmed at:', authData.user.email_confirmed_at || 'NOT CONFIRMED - email should be sent');

      // Check if email confirmation is required
      if (authData.user && !authData.user.email_confirmed_at) {
        console.log('[CoachSignup] Email confirmation required, redirecting to Check Your Email page');
        // Email confirmation required - redirect to dedicated page
        navigate('/check-email', {
          state: { email: formData.email },
          replace: true
        });
        setLoading(false);
        return;
      } else {
        // User is auto-confirmed (shouldn't happen with email confirmation enabled)
        console.log('[CoachSignup] User auto-confirmed, creating profile immediately...');

        try {
          // Create coach profile using robust utility
          const profileId = await createCoachProfile(authData.user, {
            name: fullName,
            is_verified: verified,
          });

          console.log('[CoachSignup] ✅ Profile created for auto-confirmed user:', profileId);

          // Navigate to dashboard or confirmation page
          setStep(3);

        } catch (profileError: any) {
          console.error('[CoachSignup] Auto-confirm profile creation failed:', profileError);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.message.includes('already registered')) {
        setSignupError('This email is already registered. Please login instead.');
      } else {
        setSignupError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Date Generators
  const days = Array.from({length: 31}, (_, i) => i + 1);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 100}, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Progress Tracker */}
        <div className="mb-10 flex justify-center items-center space-x-4">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-brand-600' : 'text-slate-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 1 ? 'border-brand-600 bg-brand-50' : 'border-slate-300'}`}>1</span>
            <span className="hidden sm:inline font-medium">Details</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-200"></div>
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-brand-600' : 'text-slate-400'}`}>
             <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 2 ? 'border-brand-600 bg-brand-50' : 'border-slate-300'}`}>2</span>
             <span className="hidden sm:inline font-medium">License</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-200"></div>
          <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-brand-600' : 'text-slate-400'}`}>
             <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 3 ? 'border-brand-600 bg-brand-50' : 'border-slate-300'}`}>3</span>
             <span className="hidden sm:inline font-medium">Verify</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="p-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Create your CoachDog account</h2>
              <p className="text-slate-600 mb-6">Sign up now - no payment required. Get instant 30-day free trial access.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="e.g. Jane"
                    required
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="e.g. Doe"
                    required
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                   <div className="flex space-x-2">
                       <select name="dobDay" value={formData.dobDay} onChange={handleChange} className="w-1/3 px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                          {days.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                       <select name="dobMonth" value={formData.dobMonth} onChange={handleChange} className="w-1/3 px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                       </select>
                       <select name="dobYear" value={formData.dobYear} onChange={handleChange} className="w-1/3 px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                       </select>
                   </div>
                </div>

                <div className="col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                   <input
                     name="email"
                     type="email"
                     value={formData.email}
                     onChange={handleChange}
                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                     placeholder="jane@coaching.com"
                   />
                </div>

                <div className="col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                   <div className="relative">
                     <input
                       name="password"
                       type={showPassword ? "text" : "password"}
                       value={formData.password}
                       onChange={handleChange}
                       className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none pr-10"
                     />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                     >
                       {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                     </button>
                   </div>

                   {/* Password Strength Indicator */}
                   {formData.password && (
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

                       {/* Warnings for easily guessable patterns */}
                       {passwordStrength.warnings.length > 0 && formData.password.length >= 8 && (
                         <div className="mt-3 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                           <p className="text-xs font-semibold text-yellow-800 mb-2 flex items-center">
                             <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                             Security Warnings:
                           </p>
                           <ul className="space-y-1">
                             {passwordStrength.warnings.map((warning, i) => (
                               <li key={i} className="text-xs text-yellow-800 flex items-start">
                                 <span className="mr-1">•</span>
                                 <span>{warning}</span>
                               </li>
                             ))}
                           </ul>
                           <p className="text-xs text-yellow-700 mt-2 italic">
                             Consider using a more random password with mixed characters, avoiding common words and sequences.
                           </p>
                         </div>
                       )}
                     </div>
                   )}
                </div>
              </div>

              {ageError && (
                  <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg flex items-start text-red-800 shadow-sm animate-fade-in">
                      <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                          <p className="font-bold">Age Restriction</p>
                          <p className="text-sm">{ageError}</p>
                      </div>
                  </div>
              )}

              {signupError && (
                  <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg flex items-start text-red-800 shadow-sm animate-fade-in">
                      <XCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                          <p className="text-sm">{signupError}</p>
                          {signupError.includes('already exists') && (
                            <Link
                              to="/coach-login"
                              className="mt-3 inline-block text-sm font-bold text-brand-600 hover:text-brand-700 underline"
                            >
                              ← Go to Login / Forgot Password
                            </Link>
                          )}
                      </div>
                  </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleStep1Submit}
                  disabled={checkingEmail || !formData.first_name || !formData.last_name || !formData.email || !formData.password || passwordStrength.score < 3}
                  className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {checkingEmail ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin mr-2" />
                      Validating Email...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Verification */}
          {step === 2 && (
            <div className="p-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Accreditation</h2>
              <p className="text-slate-500 mb-8">We verify all coaches to ensure quality. Please enter your details below.</p>

              <div className="space-y-6 max-w-lg mx-auto">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Accrediting Body</label>
                    <select name="body" value={formData.body} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                       <option value="EMCC">EMCC (European Mentoring & Coaching Council)</option>
                       <option value="ICF">ICF (International Coaching Federation)</option>
                       <option value="AC">Association for Coaching</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Registration / Member Number</label>
                    <input name="regNumber" type="text" value={formData.regNumber} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. 12345-AB" />
                 </div>

                 {!verified ? (
                   <button
                     onClick={handleVerification}
                     disabled={loading || !formData.regNumber}
                     className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex justify-center items-center shadow-md"
                   >
                     {loading ? <Loader className="h-5 w-5 animate-spin mr-2" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                     {loading ? 'Verifying...' : 'Verify Now'}
                   </button>
                 ) : (
                   <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-center text-green-700 animate-fade-in shadow-sm">
                      <CheckCircle className="h-6 w-6 mr-2" />
                      <span className="font-bold">Verification Successful!</span>
                   </div>
                 )}
              </div>

              <div className="mt-8 flex justify-between border-t border-slate-100 pt-6">
                 <button onClick={() => setStep(1)} className="text-slate-500 font-medium hover:text-slate-800">Back</button>
                 <button
                  onClick={handleCompleteSignup}
                  disabled={!verified || loading}
                  className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                 >
                   {loading ? (
                     <>
                       <Loader className="h-5 w-5 animate-spin mr-2" />
                       Creating Account...
                     </>
                   ) : (
                     'Create Account'
                   )}
                 </button>
              </div>

              {signupError && (
                  <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg flex items-start text-red-800 shadow-sm animate-fade-in">
                      <XCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                          <p className="text-sm">{signupError}</p>
                      </div>
                  </div>
              )}
            </div>
          )}

          {/* Step 3: Email Verification Sent */}
          {step === 3 && (
            <div className="p-8 animate-fade-in bg-slate-50 text-center">
              <div className="max-w-md mx-auto">
                 <div className="bg-white rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Mail className="h-10 w-10 text-brand-600" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h2>
                 <p className="text-slate-500 mb-2">
                   We've sent a verification link to:
                 </p>
                 <p className="font-bold text-slate-700 mb-8"> {formData.email} </p>

                 <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6 text-left">
                   <p className="text-brand-900 text-sm font-semibold mb-2">What's next?</p>
                   <ol className="text-brand-800 text-sm space-y-1 ml-4 list-decimal">
                     <li>Check your email inbox (and spam folder)</li>
                     <li>Click the verification link</li>
                     <li>Your 30-day free trial activates automatically - no payment needed!</li>
                   </ol>
                 </div>

                 <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                   <p className="text-blue-900 text-xs font-semibold mb-1">Didn't receive the email?</p>
                   <p className="text-blue-800 text-xs mb-3">
                     Check your spam folder or wait a few minutes for delivery.
                   </p>
                   <button
                     onClick={() => navigate('/resend-verification')}
                     className="text-brand-600 hover:text-brand-700 font-semibold text-sm underline"
                   >
                     Resend verification email →
                   </button>
                 </div>

                 <button
                   onClick={() => navigate('/coach-login')}
                   className="text-slate-600 hover:text-brand-600 font-medium text-sm transition-colors"
                 >
                   Back to Login
                 </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
