/**
 * Standardized Error Handling Utility
 *
 * This utility provides consistent error handling across the application:
 * - Shows user-friendly generic messages to users
 * - Logs detailed technical errors for debugging
 * - Categorizes errors for different contexts
 */

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorResponse {
  userMessage: string;
  shouldRetry: boolean;
  shouldRedirect?: string;
}

/**
 * Generic user-facing error messages
 */
const GENERIC_MESSAGES = {
  network: "We're having trouble connecting. Please check your internet connection and try again.",
  auth: "Sorry, something went wrong with authentication. Please try logging in again.",
  validation: "Please check your information and try again.",
  rateLimit: "Too many attempts. Please wait a few minutes before trying again.",
  notFound: "We couldn't find what you're looking for. Please try again or contact support.",
  alreadyExists: "This information already exists in our system. Please try logging in instead.",
  default: "Sorry, something went wrong. Please try again or contact support if the problem persists.",
  permission: "You don't have permission to perform this action.",
  serverError: "Our servers are experiencing issues. Please try again in a few moments.",
};

/**
 * Maps technical error patterns to error categories
 */
function categorizeError(error: any): keyof typeof GENERIC_MESSAGES {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';
  const statusCode = error?.status || error?.statusCode;

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorCode === 'network_error' ||
    statusCode === 0
  ) {
    return 'network';
  }

  // Authentication errors
  if (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('token') ||
    errorMessage.includes('session') ||
    errorCode === 'auth_error' ||
    statusCode === 401
  ) {
    return 'auth';
  }

  // Validation errors
  if (
    errorMessage.includes('invalid') ||
    errorMessage.includes('validation') ||
    errorMessage.includes('required') ||
    errorMessage.includes('format') ||
    statusCode === 400 ||
    statusCode === 422
  ) {
    return 'validation';
  }

  // Rate limiting
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many') ||
    errorMessage.includes('quota') ||
    statusCode === 429
  ) {
    return 'rateLimit';
  }

  // Not found
  if (
    errorMessage.includes('not found') ||
    errorMessage.includes('does not exist') ||
    statusCode === 404
  ) {
    return 'notFound';
  }

  // Already exists
  if (
    errorMessage.includes('already exists') ||
    errorMessage.includes('duplicate') ||
    errorMessage.includes('already registered') ||
    errorMessage.includes('already confirmed') ||
    statusCode === 409
  ) {
    return 'alreadyExists';
  }

  // Permission errors
  if (
    errorMessage.includes('forbidden') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('access denied') ||
    statusCode === 403
  ) {
    return 'permission';
  }

  // Server errors
  if (statusCode >= 500 && statusCode < 600) {
    return 'serverError';
  }

  return 'default';
}

/**
 * Handles errors with standardized user messages and detailed logging
 *
 * @param error - The error object (from catch block or API response)
 * @param context - Context about where/why the error occurred
 * @returns ErrorResponse with user-friendly message and action hints
 */
export function handleError(error: any, context: ErrorContext): ErrorResponse {
  const category = categorizeError(error);
  const userMessage = GENERIC_MESSAGES[category];

  // Log detailed error for debugging (only appears in console, not shown to user)
  console.error(`[${context.component}] Error during ${context.action}:`, {
    error: error,
    errorMessage: error?.message,
    errorCode: error?.code,
    statusCode: error?.status || error?.statusCode,
    category,
    context,
    timestamp: new Date().toISOString(),
  });

  // Determine if user should retry
  const shouldRetry = ['network', 'serverError', 'default'].includes(category);

  // Determine if we should redirect (e.g., auth errors -> login)
  let shouldRedirect: string | undefined;
  if (category === 'auth') {
    shouldRedirect = '/coach-login';
  } else if (category === 'alreadyExists' && context.action === 'signup') {
    shouldRedirect = '/coach-login';
  }

  return {
    userMessage,
    shouldRetry,
    shouldRedirect,
  };
}

/**
 * Special handler for email verification errors
 * Provides more specific user guidance for verification-related issues
 */
export function handleVerificationError(error: any, context: ErrorContext): ErrorResponse {
  const errorMessage = error?.message?.toLowerCase() || '';

  // Already verified - this is actually success
  if (
    errorMessage.includes('already confirmed') ||
    errorMessage.includes('already verified')
  ) {
    console.info(`[${context.component}] Email already verified for ${context.action}`);
    return {
      userMessage: 'Your email is already verified! You can log in now.',
      shouldRetry: false,
      shouldRedirect: '/coach-login',
    };
  }

  // Expired link - provide resend option
  if (
    errorMessage.includes('expired') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('token')
  ) {
    console.warn(`[${context.component}] Verification link expired during ${context.action}`, error);
    return {
      userMessage: 'This verification link has expired or is no longer valid. Verification links expire after 24 hours for security. Please request a new verification email below.',
      shouldRetry: false,
      shouldRedirect: undefined, // Stay on current page (should show resend form)
    };
  }

  // Email not found - might need to sign up again
  if (errorMessage.includes('not found') || errorMessage.includes('user not found')) {
    console.warn(`[${context.component}] Email not found during ${context.action}`, error);
    return {
      userMessage: 'We couldn\'t find an account with this email address. This means you may not have signed up yet, or the signup didn\'t complete. Please create a new account to continue.',
      shouldRetry: false,
      shouldRedirect: '/coach-signup',
    };
  }

  // Rate limiting
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    console.warn(`[${context.component}] Rate limited during ${context.action}`, error);
    return {
      userMessage: 'Too many verification attempts. Please wait a few minutes before trying again.',
      shouldRetry: false,
      shouldRedirect: undefined,
    };
  }

  // Default to generic handler for other errors
  return handleError(error, context);
}

/**
 * Special handler for authentication errors (login/signup)
 */
export function handleAuthError(error: any, context: ErrorContext): ErrorResponse {
  const errorMessage = error?.message?.toLowerCase() || '';

  // Invalid credentials
  if (
    errorMessage.includes('invalid login') ||
    errorMessage.includes('invalid credentials') ||
    errorMessage.includes('email not confirmed')
  ) {
    console.warn(`[${context.component}] Invalid credentials during ${context.action}`, error);
    return {
      userMessage: 'Invalid email or password. Please check your credentials and try again.',
      shouldRetry: true,
      shouldRedirect: undefined,
    };
  }

  // Email not verified
  if (errorMessage.includes('email not confirmed') || errorMessage.includes('not verified')) {
    console.warn(`[${context.component}] Email not verified during ${context.action}`, error);
    return {
      userMessage: 'Please verify your email before logging in. Check your inbox for the verification link.',
      shouldRetry: false,
      shouldRedirect: '/check-email',
    };
  }

  // Default to generic handler
  return handleError(error, context);
}
