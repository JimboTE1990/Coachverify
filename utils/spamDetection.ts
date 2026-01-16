/**
 * Spam Detection for Reviews
 * Automatically filters out spam, abusive, and suspicious reviews
 */

interface SpamCheckResult {
  isSpam: boolean;
  confidence: number; // 0-100
  reasons: string[];
  category?: 'abusive' | 'promotional' | 'nonsense' | 'repetitive' | 'suspicious';
}

// Common spam patterns
const SPAM_PATTERNS = {
  // Excessive links or URLs
  urls: /https?:\/\/|www\.|\.com|\.net|\.org|\.co\.uk/gi,

  // Phone numbers
  phoneNumbers: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10,}/g,

  // Email addresses
  emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // Excessive capitals
  excessiveCaps: /[A-Z]{5,}/g,

  // Excessive punctuation
  excessivePunctuation: /[!?.]{3,}/g,

  // Common spam phrases
  spamPhrases: /click here|buy now|limited time|act now|free money|make money fast|work from home|earn \$|bitcoin|crypto|investment opportunity/gi,

  // Promotional language
  promotional: /special offer|discount code|promo|visit my|check out my|follow me|subscribe|channel|instagram\.com|youtube\.com/gi,
};

// Abusive/offensive language detection
const ABUSIVE_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap',
  'idiot', 'stupid', 'moron', 'dumb', 'loser', 'scam',
  'fraud', 'fake', 'liar', 'worst', 'terrible', 'awful',
  'useless', 'pathetic', 'disgusting'
];

// Repetitive character patterns
const REPETITIVE_PATTERN = /(.)\1{4,}/g; // Same character 5+ times

/**
 * Main spam detection function
 */
export const detectSpam = (reviewText: string, authorName: string): SpamCheckResult => {
  const reasons: string[] = [];
  let spamScore = 0;
  let category: SpamCheckResult['category'] | undefined;

  // Normalize text for checking
  const normalizedText = reviewText.toLowerCase().trim();
  const normalizedAuthor = authorName.toLowerCase().trim();

  // 1. Check for extremely short reviews (likely spam)
  if (normalizedText.length < 10) {
    reasons.push('Review too short (< 10 characters)');
    spamScore += 30;
  }

  // 2. Check for URLs/links
  const urlMatches = reviewText.match(SPAM_PATTERNS.urls);
  if (urlMatches && urlMatches.length > 0) {
    reasons.push(`Contains ${urlMatches.length} URL(s) or link(s)`);
    spamScore += 40;
    category = 'promotional';
  }

  // 3. Check for phone numbers
  const phoneMatches = reviewText.match(SPAM_PATTERNS.phoneNumbers);
  if (phoneMatches && phoneMatches.length > 0) {
    reasons.push('Contains phone number(s)');
    spamScore += 35;
    category = 'promotional';
  }

  // 4. Check for email addresses
  const emailMatches = reviewText.match(SPAM_PATTERNS.emails);
  if (emailMatches && emailMatches.length > 0) {
    reasons.push('Contains email address(es)');
    spamScore += 35;
    category = 'promotional';
  }

  // 5. Check for excessive capitals
  const capsMatches = reviewText.match(SPAM_PATTERNS.excessiveCaps);
  if (capsMatches && capsMatches.length > 2) {
    reasons.push('Excessive use of CAPITAL LETTERS');
    spamScore += 20;
  }

  // 6. Check for excessive punctuation
  const punctuationMatches = reviewText.match(SPAM_PATTERNS.excessivePunctuation);
  if (punctuationMatches && punctuationMatches.length > 1) {
    reasons.push('Excessive punctuation (!!!, ???)');
    spamScore += 15;
  }

  // 7. Check for common spam phrases
  const spamPhraseMatches = reviewText.match(SPAM_PATTERNS.spamPhrases);
  if (spamPhraseMatches && spamPhraseMatches.length > 0) {
    reasons.push(`Contains spam phrases: "${spamPhraseMatches.slice(0, 2).join('", "')}"`);
    spamScore += 40;
    category = 'promotional';
  }

  // 8. Check for promotional language
  const promoMatches = reviewText.match(SPAM_PATTERNS.promotional);
  if (promoMatches && promoMatches.length > 1) {
    reasons.push('Contains promotional/marketing language');
    spamScore += 30;
    category = 'promotional';
  }

  // 9. Check for abusive/offensive language
  let abusiveCount = 0;
  const foundAbusiveWords: string[] = [];
  ABUSIVE_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(normalizedText)) {
      abusiveCount++;
      if (foundAbusiveWords.length < 3) {
        foundAbusiveWords.push(word);
      }
    }
  });

  if (abusiveCount > 0) {
    reasons.push(`Contains ${abusiveCount} potentially abusive/offensive word(s)`);
    spamScore += abusiveCount * 25;
    category = 'abusive';
  }

  // 10. Check for repetitive characters (aaaaa, !!!!!!)
  const repetitiveMatches = reviewText.match(REPETITIVE_PATTERN);
  if (repetitiveMatches && repetitiveMatches.length > 2) {
    reasons.push('Contains excessive repetitive characters');
    spamScore += 20;
    category = 'nonsense';
  }

  // 11. Check for nonsense text (very few vowels or consonants)
  const vowelCount = (normalizedText.match(/[aeiou]/g) || []).length;
  const consonantCount = (normalizedText.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
  const totalLetters = vowelCount + consonantCount;

  if (totalLetters > 10) {
    const vowelRatio = vowelCount / totalLetters;
    if (vowelRatio < 0.15 || vowelRatio > 0.65) {
      reasons.push('Unusual character distribution (possible nonsense)');
      spamScore += 25;
      category = category || 'nonsense';
    }
  }

  // 12. Check for repetitive words
  const words = normalizedText.split(/\s+/);
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    if (word.length > 2) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });

  const repeatedWords = Object.entries(wordCounts).filter(([, count]) => count > 3);
  if (repeatedWords.length > 0) {
    reasons.push(`Excessive word repetition: "${repeatedWords[0][0]}" repeated ${repeatedWords[0][1]} times`);
    spamScore += 20;
    category = category || 'repetitive';
  }

  // 13. Check for suspicious author names
  if (normalizedAuthor.match(SPAM_PATTERNS.urls) ||
      normalizedAuthor.match(SPAM_PATTERNS.emails) ||
      normalizedAuthor.length < 2 ||
      normalizedAuthor.match(/\d{5,}/)) {
    reasons.push('Suspicious author name format');
    spamScore += 20;
    category = category || 'suspicious';
  }

  // 14. Check if review is all one word/no spaces (likely gibberish)
  if (words.length === 1 && normalizedText.length > 20) {
    reasons.push('No spaces detected (likely gibberish)');
    spamScore += 30;
    category = 'nonsense';
  }

  // Cap spam score at 100
  spamScore = Math.min(100, spamScore);

  // Determine if spam (threshold: 50)
  const isSpam = spamScore >= 50;

  return {
    isSpam,
    confidence: spamScore,
    reasons,
    category: isSpam ? category : undefined
  };
};

/**
 * Get user-friendly message for spam detection
 */
export const getSpamMessage = (result: SpamCheckResult): string => {
  if (!result.isSpam) return '';

  const messages = {
    abusive: 'Your review contains language that may be offensive or abusive. Please revise your review to be respectful and constructive.',
    promotional: 'Your review appears to be promotional or contains contact information. Reviews should focus on your coaching experience only.',
    nonsense: 'Your review doesn\'t appear to contain meaningful content. Please provide genuine feedback about your coaching experience.',
    repetitive: 'Your review contains excessive repetition. Please provide varied, genuine feedback.',
    suspicious: 'Your review has been flagged for unusual patterns. Please ensure it\'s a genuine review of your coaching experience.'
  };

  return messages[result.category!] || 'Your review has been flagged as potentially spam. Please ensure it\'s genuine feedback about your coaching experience.';
};

/**
 * Check if coach's spam flag is legitimate
 * Returns confidence score 0-100 on whether the flag is justified
 */
export const validateCoachSpamFlag = (reviewText: string, authorName: string, coachReason?: string): {
  isLegitimateFlag: boolean;
  confidence: number;
  analysis: string;
} => {
  // Run spam detection
  const spamCheck = detectSpam(reviewText, authorName);

  // If our AI already detected it as spam, the flag is definitely legitimate
  if (spamCheck.isSpam) {
    return {
      isLegitimateFlag: true,
      confidence: spamCheck.confidence,
      analysis: `Automated spam detection agrees with coach's flag. ${spamCheck.reasons.join('; ')}`
    };
  }

  // If not detected as spam, check for edge cases the coach might have noticed
  let edgeCaseScore = 0;
  const edgeReasons: string[] = [];

  // Check if coach mentioned specific reasons
  if (coachReason) {
    const lowerReason = coachReason.toLowerCase();

    if (lowerReason.includes('fake') || lowerReason.includes('not a client')) {
      edgeCaseScore += 30;
      edgeReasons.push('Coach claims reviewer is not a genuine client');
    }

    if (lowerReason.includes('competitor') || lowerReason.includes('rival')) {
      edgeCaseScore += 25;
      edgeReasons.push('Coach suspects competitor sabotage');
    }

    if (lowerReason.includes('never coached') || lowerReason.includes('never worked')) {
      edgeCaseScore += 30;
      edgeReasons.push('Coach claims no coaching relationship existed');
    }
  }

  // Check for very generic reviews that might be fake
  const genericPhrases = ['great coach', 'highly recommend', 'very professional', 'excellent service'];
  const reviewLower = reviewText.toLowerCase();
  let genericCount = 0;

  genericPhrases.forEach(phrase => {
    if (reviewLower.includes(phrase)) genericCount++;
  });

  if (genericCount >= 2 && reviewText.split(/\s+/).length < 15) {
    edgeCaseScore += 20;
    edgeReasons.push('Review is very short and uses only generic phrases');
  }

  // If edge case score is high enough, consider flag legitimate
  const isLegitimate = edgeCaseScore >= 40 || spamCheck.confidence >= 30;
  const finalConfidence = Math.max(spamCheck.confidence, edgeCaseScore);

  return {
    isLegitimateFlag: isLegitimate,
    confidence: finalConfidence,
    analysis: isLegitimate
      ? `Flag appears justified. ${edgeReasons.join('; ') || spamCheck.reasons.join('; ')}`
      : 'Flag does not appear justified based on automated analysis. Review appears genuine.'
  };
};
