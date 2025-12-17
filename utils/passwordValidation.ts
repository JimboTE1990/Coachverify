export interface PasswordStrength {
  score: number; // 0-4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  errors: string[];
  warnings: string[]; // New: warnings for guessable patterns
}

// Common words and patterns that make passwords weak
const COMMON_WORDS = [
  'password', 'admin', 'user', 'test', 'demo', 'welcome', 'login',
  'coach', 'coachdog', 'email', 'letmein', 'qwerty', 'abc', 'xyz',
  'hello', 'world', 'master', 'super', 'secret', 'pass', 'key'
];

const COMMON_PATTERNS = [
  '123', '234', '345', '456', '567', '678', '789', '890',
  '321', '432', '543', '654', '765', '876', '987', '098',
  'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij',
  'zyx', 'yxw', 'xwv', 'wvu', 'vut', 'uts', 'tsr', 'srq'
];

const KEYBOARD_PATTERNS = [
  'qwert', 'werty', 'ertyu', 'rtyui', 'tyuio', 'yuiop',
  'asdfg', 'sdfgh', 'dfghj', 'fghjk', 'ghjkl',
  'zxcvb', 'xcvbn', 'cvbnm',
  'qazwsx', 'wsxedc', 'edcrfv'
];

/**
 * Detects sequential numbers in password (e.g., 123, 456, 789)
 */
const hasNumberSequence = (password: string): boolean => {
  for (let i = 0; i < password.length - 2; i++) {
    const char1 = password.charCodeAt(i);
    const char2 = password.charCodeAt(i + 1);
    const char3 = password.charCodeAt(i + 2);

    // Check if three consecutive chars are sequential numbers
    if (
      char1 >= 48 && char1 <= 57 && // char1 is a digit
      char2 === char1 + 1 &&
      char3 === char2 + 1
    ) {
      return true;
    }

    // Check reverse sequence (321, 654, etc.)
    if (
      char1 >= 48 && char1 <= 57 &&
      char2 === char1 - 1 &&
      char3 === char2 - 1
    ) {
      return true;
    }
  }
  return false;
};

/**
 * Detects sequential letters in password (e.g., abc, xyz)
 */
const hasLetterSequence = (password: string): boolean => {
  const lowerPassword = password.toLowerCase();
  for (let i = 0; i < lowerPassword.length - 2; i++) {
    const char1 = lowerPassword.charCodeAt(i);
    const char2 = lowerPassword.charCodeAt(i + 1);
    const char3 = lowerPassword.charCodeAt(i + 2);

    // Check if three consecutive chars are sequential letters
    if (
      char1 >= 97 && char1 <= 122 && // char1 is a lowercase letter
      char2 === char1 + 1 &&
      char3 === char2 + 1
    ) {
      return true;
    }

    // Check reverse sequence (zyx, cba, etc.)
    if (
      char1 >= 97 && char1 <= 122 &&
      char2 === char1 - 1 &&
      char3 === char2 - 1
    ) {
      return true;
    }
  }
  return false;
};

/**
 * Detects repeated characters (e.g., aaa, 111, !!!)
 */
const hasRepeatedCharacters = (password: string): boolean => {
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
      return true;
    }
  }
  return false;
};

/**
 * Checks if password contains common words
 */
const containsCommonWord = (password: string): string | null => {
  const lowerPassword = password.toLowerCase();
  for (const word of COMMON_WORDS) {
    if (lowerPassword.includes(word)) {
      return word;
    }
  }
  return null;
};

/**
 * Checks if password contains keyboard patterns
 */
const containsKeyboardPattern = (password: string): boolean => {
  const lowerPassword = password.toLowerCase();
  for (const pattern of KEYBOARD_PATTERNS) {
    if (lowerPassword.includes(pattern)) {
      return true;
    }
  }
  return false;
};

/**
 * Checks if password is mostly numbers with minimal letters
 */
const isMostlyNumbers = (password: string): boolean => {
  const numbers = password.match(/[0-9]/g)?.length || 0;
  const letters = password.match(/[a-zA-Z]/g)?.length || 0;
  return numbers > 0 && letters <= 2 && numbers >= password.length * 0.7;
};

/**
 * Checks if password has good character variety
 */
const hasGoodVariety = (password: string): boolean => {
  const uniqueChars = new Set(password.toLowerCase()).size;
  return uniqueChars >= password.length * 0.6; // At least 60% unique characters
};

export const validatePassword = (password: string): PasswordStrength => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Minimum length check (required)
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score++;
  }

  // Has uppercase (required)
  if (!/[A-Z]/.test(password)) {
    errors.push('Include at least one uppercase letter');
  } else {
    score++;
  }

  // Has lowercase (required)
  if (!/[a-z]/.test(password)) {
    errors.push('Include at least one lowercase letter');
  } else {
    score++;
  }

  // Has number (required)
  if (!/[0-9]/.test(password)) {
    errors.push('Include at least one number');
  } else {
    score++;
  }

  // Has special character (required)
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Include at least one special character (!@#$%^&*)');
  } else {
    score++;
  }

  // Check for common weaknesses (these are warnings, not hard errors)
  if (password.length >= 8) { // Only check if minimum length is met

    // Check for number sequences
    if (hasNumberSequence(password)) {
      warnings.push('⚠️ Contains number sequence (e.g., 123, 456) - easily guessable');
      score = Math.max(0, score - 1); // Penalize score
    }

    // Check for letter sequences
    if (hasLetterSequence(password)) {
      warnings.push('⚠️ Contains letter sequence (e.g., abc, xyz) - easily guessable');
      score = Math.max(0, score - 1);
    }

    // Check for repeated characters
    if (hasRepeatedCharacters(password)) {
      warnings.push('⚠️ Contains repeated characters (e.g., aaa, 111) - weak pattern');
      score = Math.max(0, score - 1);
    }

    // Check for common words
    const commonWord = containsCommonWord(password);
    if (commonWord) {
      warnings.push(`⚠️ Contains common word "${commonWord}" - easily guessable`);
      score = Math.max(0, score - 1);
    }

    // Check for keyboard patterns
    if (containsKeyboardPattern(password)) {
      warnings.push('⚠️ Contains keyboard pattern (e.g., qwerty, asdf) - easily guessable');
      score = Math.max(0, score - 1);
    }

    // Check if mostly numbers
    if (isMostlyNumbers(password)) {
      warnings.push('⚠️ Mostly numbers with few letters - use more letters for randomness');
      score = Math.max(0, score - 1);
    }

    // Check character variety
    if (!hasGoodVariety(password)) {
      warnings.push('⚠️ Too many repeated characters - use more variety');
      score = Math.max(0, score - 0.5);
    }

    // Check for dates (common pattern: 1990, 2000, etc.)
    if (/19[0-9]{2}|20[0-9]{2}/.test(password)) {
      warnings.push('⚠️ Contains a year (e.g., 1990, 2023) - avoid dates');
      score = Math.max(0, score - 0.5);
    }
  }

  // Bonus for excellent length (12+ characters with no warnings)
  if (password.length >= 12 && warnings.length === 0) {
    score = Math.min(score + 1, 5);
  }

  // If there are warnings, cap the maximum score
  if (warnings.length > 0) {
    score = Math.min(score, 3); // Maximum "Fair" rating if there are warnings
  }

  // If there are multiple warnings, reduce further
  if (warnings.length >= 2) {
    score = Math.min(score, 2); // Maximum "Weak" rating if multiple warnings
  }

  // Determine label and color based on final score
  let label: PasswordStrength['label'];
  let color: string;

  if (score <= 1) {
    label = 'Very Weak';
    color = '#ef4444'; // red
  } else if (score === 2) {
    label = 'Weak';
    color = '#f97316'; // orange
  } else if (score === 3) {
    label = 'Fair';
    color = '#eab308'; // yellow
  } else if (score === 4) {
    label = 'Good';
    color = '#22c55e'; // green
  } else {
    label = 'Strong';
    color = '#10b981'; // emerald
  }

  return { score, label, color, errors, warnings };
};

/**
 * Suggests a stronger password approach
 */
export const getPasswordSuggestion = (): string => {
  return 'Use a random mix of uppercase, lowercase, numbers, and symbols. Avoid common words, sequences (123, abc), keyboard patterns (qwerty), and personal information. Consider using a passphrase with random words separated by symbols.';
};
