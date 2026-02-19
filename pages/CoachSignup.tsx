import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle, ArrowRight, Loader, Mail, AlertTriangle, Eye, EyeOff, XCircle, Info, ExternalLink } from 'lucide-react';
import { verifyCoachLicense } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../utils/passwordValidation';
import { createCoachProfile } from '../utils/profileCreation';
import { withTimeout } from '../utils/promiseTimeout';
import { useAuth } from '../hooks/useAuth';
import { handleAuthError, handleError } from '../utils/errorHandling';

export const CoachSignup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showAccreditationInfo, setShowAccreditationInfo] = useState(false);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const hasRedirected = useRef(false);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAccreditationInfo && infoButtonRef.current && !infoButtonRef.current.contains(event.target as Node)) {
        const popup = document.getElementById('accreditation-info-popup');
        if (popup && !popup.contains(event.target as Node)) {
          setShowAccreditationInfo(false);
        }
      }
    };

    if (showAccreditationInfo) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAccreditationInfo]);

  // Capture partner referral URL param (?ref=emcc, ?ref=icf, etc.)
  useEffect(() => {
    const refParam = (searchParams.get('ref') || searchParams.get('partner') || '').toLowerCase().trim();
    if (!refParam) return;

    // Store referral source in sessionStorage for profile creation
    sessionStorage.setItem('coachdog_referral', refParam);

    // Pre-fill accreditation body based on referral
    const bodyMap: Record<string, string> = { emcc: 'EMCC', icf: 'ICF', ac: 'AC' };
    if (bodyMap[refParam]) {
      setFormData(prev => ({ ...prev, body: bodyMap[refParam] }));
    }

    // Auto-apply partner discount code
    const partnerDiscounts: Record<string, string> = { emcc: 'EMCC15', icf: 'ICF15' };
    if (partnerDiscounts[refParam]) {
      sessionStorage.setItem('coachdog_discount', partnerDiscounts[refParam]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    body: 'EMCC',
    regNumber: '',
    location: '', // NEW: For ICF verification (City, Country)
    accreditationLevel: '', // NEW: For ICF credential level
  });

  const passwordStrength = validatePassword(formData.password);
  const fullName = `${formData.first_name} ${formData.last_name}`.trim();
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      setSignupError('');
      setPasswordMismatch('');
    }
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
          'An account with this email already exists. Please use the "Forgot Password" link on the login page, or contact support@coachdog.co.uk if you need help accessing your account.'
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

  const validateEmail = (email: string): boolean => {
    // RFC 5322 compliant email regex pattern
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleStep1Submit = async () => {
    setSignupError('');

    // Validate email format first
    if (!validateEmail(formData.email)) {
      setSignupError('Please enter a valid email address (e.g., jane@coaching.com)');
      return;
    }

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

    // Proceed to step 2
    setStep(2);
  };

  const handleVerification = async () => {
    setLoading(true);
    setSignupError('');

    try {
      const fullName = `${formData.first_name} ${formData.last_name}`.trim();

      // Use a temporary ID for verification (will be replaced with real coach ID after signup)
      const tempCoachId = `temp_${Date.now()}`;

      const result = await verifyCoachLicense(
        formData.body,
        formData.regNumber,
        tempCoachId,
        fullName,
        formData.accreditationLevel, // accreditationLevel (for ICF)
        undefined, // country - optional
        formData.location // location (for ICF: City, Country)
      );

      setLoading(false);

      if (result.verified) {
        setVerified(true);
      } else if ((result as any).pendingManualReview) {
        // Allow signup to continue with pending verification
        setVerified(true); // Allow them to proceed
        setSignupError(''); // Clear any errors
        // Show info message instead
        alert('✓ Credentials submitted! Your accreditation will be manually verified within 24 hours. You can complete your signup now.');
      } else {
        setSignupError(result.reason || "Could not verify your accreditation. Please check your details.");
      }
    } catch (error) {
      setLoading(false);
      setSignupError("Verification failed. Please try again or contact support.");
      console.error('[handleVerification] Error:', error);
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
              gender: formData.gender,
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
        const errorResponse = handleAuthError(authError, {
          component: 'CoachSignup',
          action: 'create account',
          metadata: { email: formData.email }
        });
        setSignupError(errorResponse.userMessage);
        setLoading(false);
        return;
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
          const referralSource = sessionStorage.getItem('coachdog_referral') || undefined;
          const profileId = await createCoachProfile(authData.user, {
            name: fullName,
            is_verified: verified,
            referral_source: referralSource,
          });
          if (referralSource) sessionStorage.removeItem('coachdog_referral');

          console.log('[CoachSignup] ✅ Profile created for auto-confirmed user:', profileId);

          // Navigate to dashboard or confirmation page
          setStep(3);

        } catch (profileError: any) {
          console.error('[CoachSignup] Auto-confirm profile creation failed:', profileError);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
      }
    } catch (error: any) {
      const errorResponse = handleError(error, {
        component: 'CoachSignup',
        action: 'complete signup',
        metadata: { step: 'final', email: formData.email }
      });
      setSignupError(errorResponse.userMessage);
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

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Gender</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((g) => (
                      <label key={g} className="flex items-center cursor-pointer p-3 rounded-lg border-2 border-slate-200 hover:border-brand-500 transition-all">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={formData.gender === g}
                          onChange={handleChange}
                          className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm font-medium text-slate-800">{g}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3">
                    <input
                      type="text"
                      name="gender"
                      placeholder="Prefer to self-describe (optional)"
                      value={formData.gender && !['Male', 'Female', 'Non-binary', 'Prefer not to say'].includes(formData.gender) ? formData.gender : ''}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className={`w-full px-4 py-3 pr-20 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
                      formData.confirmPassword && !passwordsMatch
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-300'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    {formData.confirmPassword && passwordsMatch && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {formData.confirmPassword && !passwordsMatch && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-600 flex items-start mt-1">
                    <XCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                    Passwords do not match
                  </p>
                )}
              </div>

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
                  disabled={checkingEmail || !formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.confirmPassword || !passwordsMatch || passwordStrength.score < 3}
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {formData.body === 'EMCC' ? 'EMCC Profile URL' :
                       formData.body === 'ICF' ? 'ICF Directory Search URL' :
                       'Registration / Member Number'}
                    </label>
                    <button
                      ref={infoButtonRef}
                      type="button"
                      onClick={() => setShowAccreditationInfo(!showAccreditationInfo)}
                      className="mb-2 inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 border-2 border-brand-200 transition-all font-semibold text-sm shadow-sm"
                      title="Where to find your accreditation details"
                    >
                      <Info className="h-5 w-5" />
                      <span>Need help finding your URL?</span>
                    </button>

                    {/* Dynamic Info Popup - uses fixed positioning to overflow container */}
                    {showAccreditationInfo && infoButtonRef.current && (
                      <div
                        id="accreditation-info-popup"
                        className="fixed z-50 bg-white border-2 border-brand-200 rounded-xl p-4 shadow-xl overflow-y-auto max-h-[500px]
                                   md:w-96 w-[calc(100vw-2rem)] left-4 md:left-auto"
                        style={{
                          left: window.innerWidth >= 768 ? `${infoButtonRef.current.getBoundingClientRect().right + 16}px` : '1rem',
                          top: `${infoButtonRef.current.getBoundingClientRect().top}px`,
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <Info className="h-4 w-4 text-brand-500" />
                            {formData.body === 'EMCC' && 'How to Get Your EMCC Profile URL'}
                            {formData.body === 'ICF' && 'Find Your ICF Credential'}
                            {formData.body === 'AC' && 'AC Member Information'}
                          </h4>
                          <button
                            onClick={() => setShowAccreditationInfo(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            ✕
                          </button>
                        </div>

                        {/* EMCC Instructions */}
                        {formData.body === 'EMCC' && (
                          <div className="space-y-3 text-sm text-slate-700">
                            <div>
                              <p className="font-semibold text-brand-600 mb-1">📍 Step 1: Visit EMCC Directory</p>
                              <a
                                href="https://www.emccglobal.org/accreditation/eia/eia-awards/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-500 hover:text-brand-600 underline flex items-center gap-1"
                              >
                                Open EMCC Directory <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                            <div>
                              <p className="font-semibold text-brand-600 mb-1">🔍 Step 2: Search by EIA Number ONLY</p>
                              <p className="text-slate-600 mb-1">Enter <strong>ONLY your EIA number</strong> in the "Reference" field</p>
                              <div className="bg-red-50 border border-red-200 rounded p-2 mt-1">
                                <p className="text-xs text-red-700 font-semibold">⚠️ IMPORTANT: Leave all other fields blank!</p>
                                <p className="text-xs text-red-600 mt-1">Do NOT search by name - this will create the wrong URL</p>
                              </div>
                            </div>

                            <div>
                              <p className="font-semibold text-brand-600 mb-1">📋 Step 3: Copy the Complete URL</p>
                              <p className="text-slate-600">After clicking Search, copy the <strong>entire URL</strong> from your browser's address bar and paste it below</p>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="font-semibold text-green-800 mb-1">✅ Correct URL Format:</p>
                              <code className="bg-white px-2 py-1 rounded border border-green-300 text-green-700 font-mono text-xs break-all">
                                https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20230480&search=1
                              </code>
                              <p className="text-xs text-green-700 mt-2">
                                ✓ The URL must contain "reference=EIA" followed by your number
                              </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <p className="text-xs text-amber-800 font-semibold mb-1">❌ Incorrect URLs:</p>
                              <ul className="text-xs text-amber-700 space-y-1 ml-4 list-disc">
                                <li>URLs with "first_name=" or "last_name=" (name search)</li>
                                <li>The main directory page (without search results)</li>
                                <li>URLs missing your EIA number</li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* ICF Instructions */}
                        {formData.body === 'ICF' && (
                          <div className="space-y-3 text-sm text-slate-700">
                            <div>
                              <p className="font-semibold text-brand-600 mb-1">📍 Step 1: Visit ICF Directory</p>
                              <a
                                href="https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-500 hover:text-brand-600 underline flex items-center gap-1"
                              >
                                Open ICF Member Directory <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                            <div>
                              <p className="font-semibold text-brand-600 mb-1">🔍 Step 2: Search by Your Full Name</p>
                              <p className="text-slate-600 mb-1">Enter your <strong>first name</strong> and <strong>last name</strong>, then click Search</p>
                            </div>

                            <div>
                              <p className="font-semibold text-brand-600 mb-1">📋 Step 3: Copy the URL</p>
                              <p className="text-slate-600">Copy the <strong>complete URL</strong> from your browser's address bar and paste it below</p>
                            </div>

                            <div>
                              <p className="font-semibold text-brand-600 mb-1">📍 Step 4: Enter Your Location</p>
                              <p className="text-slate-600">Enter your city and country <strong>exactly as shown</strong> in your ICF profile (e.g., "London, UK")</p>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="font-semibold text-green-800 mb-1">✅ Correct URL Format:</p>
                              <code className="bg-white px-2 py-1 rounded border border-green-300 text-green-700 font-mono text-xs break-all">
                                https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carole&lastname=adams&sort=1
                              </code>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-xs text-blue-800">
                                💡 <strong>Why location?</strong> If multiple coaches share your name, your location helps us identify the correct profile.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* AC Instructions */}
                        {formData.body === 'AC' && (
                          <div className="space-y-3 text-sm text-slate-700">
                            <div>
                              <p className="font-semibold text-brand-600 mb-1">📍 Visit AC Website</p>
                              <a
                                href="https://www.associationforcoaching.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-500 hover:text-brand-600 underline flex items-center gap-1"
                              >
                                Open AC Website <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <p className="text-xs text-amber-700">
                                ⚠️ AC verification is not yet automated. Please enter your member number and we'll verify manually.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <input
                      name="regNumber"
                      type={formData.body === 'EMCC' || formData.body === 'ICF' ? 'url' : 'text'}
                      value={formData.regNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder={
                        formData.body === 'EMCC' ? 'Paste your EMCC profile URL here' :
                        formData.body === 'ICF' ? 'Paste your ICF directory search URL here' :
                        'e.g. 12345-AB'
                      }
                    />
                 </div>

                 {/* ICF: Location Field */}
                 {formData.body === 'ICF' && (
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">
                       City, Country
                     </label>
                     <input
                       name="location"
                       type="text"
                       value={formData.location}
                       onChange={handleChange}
                       className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                       placeholder="e.g., London, UK"
                       required
                     />
                     <p className="text-xs text-slate-600 mt-1">
                       This helps us verify the correct profile if multiple coaches share your name
                     </p>
                   </div>
                 )}

                 {/* ICF: Credential Level Dropdown */}
                 {formData.body === 'ICF' && (
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">
                       ICF Credential Level
                     </label>
                     <select
                       name="accreditationLevel"
                       value={formData.accreditationLevel || ''}
                       onChange={handleChange}
                       className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                       required
                     >
                       <option value="">Select your credential level</option>
                       <option value="ACC">ACC - Associate Certified Coach</option>
                       <option value="PCC">PCC - Professional Certified Coach</option>
                       <option value="MCC">MCC - Master Certified Coach</option>
                       <option value="ACTC">ACTC - Approved Coach Training Course</option>
                     </select>
                   </div>
                 )}

                 {!verified ? (
                   <div className="space-y-2">
                     <button
                       onClick={handleVerification}
                       disabled={loading || !formData.regNumber}
                       className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex justify-center items-center shadow-md"
                     >
                       {loading ? <Loader className="h-5 w-5 animate-spin mr-2" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                       {loading ? 'Verifying...' : 'Verify Now'}
                     </button>
                     {loading && (
                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fade-in">
                         <div className="flex items-start gap-3">
                           <Loader className="h-5 w-5 animate-spin text-blue-600 flex-shrink-0 mt-0.5" />
                           <div className="flex-1 text-left">
                             <p className="text-sm font-semibold text-blue-800">
                               Verification in progress...
                             </p>
                             <p className="text-xs text-blue-700 mt-1">
                               This process can take up to 1 minute as we verify your credentials with the official directory.
                             </p>
                             <p className="text-xs font-medium text-blue-800 mt-2">
                               ⚠️ Please do not leave or refresh this page.
                             </p>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
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
