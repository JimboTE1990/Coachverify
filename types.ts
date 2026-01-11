
export type Specialty = 'Career Growth' | 'Stress Relief' | 'Relationships' | 'Health & Wellness' | 'Executive Coaching' | 'General';

export type Format = 'In-Person' | 'Online' | 'Hybrid';

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'onboarding';

export type BillingCycle = 'monthly' | 'annual';

export type AccreditationLevel =
  | 'Foundation'
  | 'Practitioner'
  | 'Senior Practitioner'
  | 'Master Practitioner';

// New: Comprehensive Coaching Areas of Expertise (7 categories)
export type CoachingExpertiseCategory =
  | 'Career & Professional Development'
  | 'Business & Entrepreneurship'
  | 'Health & Wellness'
  | 'Personal & Life'
  | 'Financial'
  | 'Niche & Demographic'
  | 'Methodology & Modality';

export type CareerProfessionalExpertise =
  | 'Career Transition'
  | 'Leadership Development'
  | 'Executive Coaching'
  | 'Team Coaching'
  | 'Performance Coaching'
  | 'Communication Skills'
  | 'Public Speaking'
  | 'Interview Preparation'
  | 'Networking'
  | 'Personal Branding'
  | 'Work-Life Balance'
  | 'Time Management'
  | 'Productivity'
  | 'Confidence Building';

export type BusinessEntrepreneurshipExpertise =
  | 'Business Start-up'
  | 'Business Growth & Scaling'
  | 'Strategic Planning'
  | 'Sales Coaching'
  | 'Marketing & Branding'
  | 'Negotiation Skills'
  | 'Innovation & Creativity'
  | 'Succession Planning';

export type HealthWellnessExpertise =
  | 'Stress Management'
  | 'Mindfulness & Meditation'
  | 'Sleep Improvement'
  | 'Nutrition & Healthy Eating'
  | 'Fitness & Exercise'
  | 'Weight Management'
  | 'Chronic Illness Management'
  | 'Mental Health & Wellbeing'
  | 'Addiction Recovery'
  | 'Grief & Loss'
  | 'Burnout Recovery';

export type PersonalLifeExpertise =
  | 'Life Purpose & Meaning'
  | 'Goal Setting & Achievement'
  | 'Relationship Coaching'
  | 'Parenting'
  | 'Family Dynamics'
  | 'Divorce & Separation'
  | 'Self-Esteem & Confidence'
  | 'Personal Growth'
  | 'Spiritual Development'
  | 'Retirement Planning (Life)'
  | 'Lifestyle Design'
  | 'Creative Expression';

export type FinancialExpertise =
  | 'Financial Planning & Budgeting'
  | 'Debt Management'
  | 'Investment Coaching'
  | 'Retirement Planning (Financial)'
  | 'Money Mindset';

export type NicheDemographicExpertise =
  | 'LGBTQ+ Coaching'
  | 'Neurodiversity (ADHD, Autism, etc.)'
  | 'Youth & Students (Ages 16-25)'
  | 'Mid-Career Professionals'
  | 'Senior Professionals (50+)'
  | 'Women in Leadership'
  | 'Veterans & Military Transition'
  | 'Expats & Relocation'
  | 'Artists & Creatives'
  | 'Athletes & Sports Performance';

export type MethodologyModalityExpertise =
  | 'Cognitive Behavioral Coaching (CBC)'
  | 'Neuro-Linguistic Programming (NLP)'
  | 'Solution-Focused Coaching'
  | 'Positive Psychology'
  | 'Ontological Coaching'
  | 'Systemic Coaching'
  | 'Gestalt Coaching'
  | 'Psychodynamic Coaching'
  | 'Narrative Coaching'
  | 'Somatic Coaching'
  | 'Mindfulness-Based Coaching'
  | 'Acceptance and Commitment Therapy (ACT)'
  | 'Transactional Analysis (TA)';

// Combined type for all coaching expertise areas
export type CoachingExpertise =
  | CareerProfessionalExpertise
  | BusinessEntrepreneurshipExpertise
  | HealthWellnessExpertise
  | PersonalLifeExpertise
  | FinancialExpertise
  | NicheDemographicExpertise
  | MethodologyModalityExpertise;

// New: CPD Qualifications (Additional Professional Development Certifications)
export type CPDQualification =
  | 'ICF Associate Certified Coach (ACC)'
  | 'ICF Professional Certified Coach (PCC)'
  | 'ICF Master Certified Coach (MCC)'
  | 'EMCC Foundation Level'
  | 'EMCC Practitioner Level'
  | 'EMCC Senior Practitioner Level'
  | 'EMCC Master Practitioner Level'
  | 'AC Accredited Coach'
  | 'ILM Level 5 Coaching'
  | 'ILM Level 7 Executive Coaching'
  | 'CMI Level 5 Coaching'
  | 'CMI Level 7 Executive Coaching'
  | 'Certificate in Coaching Supervision'
  | 'Diploma in Coaching Supervision'
  | 'Mental Health First Aid (MHFA)'
  | 'Trauma-Informed Coaching Certificate'
  | 'Diversity & Inclusion Coaching Certificate'
  | 'Corporate Coaching Certification'
  | 'Team Coaching Certification'
  | 'Career Coaching Certification'
  | 'Executive Coaching Certification'
  | 'Life Coaching Certification'
  | 'Health & Wellness Coaching Certification'
  | 'Financial Coaching Certification'
  | 'Relationship Coaching Certification'
  | 'NLP Practitioner Certification'
  | 'NLP Master Practitioner Certification'
  | 'CBT (Cognitive Behavioral Therapy) Training'
  | 'Solution-Focused Brief Therapy (SFBT) Training'
  | 'Positive Psychology Practitioner'
  | 'Mindfulness Teacher Training'
  | 'Somatic Experiencing Practitioner'
  | 'Gestalt Coaching Certification'
  | 'Systemic Team Coaching'
  | 'Ontological Coaching Certification'
  | 'Transactional Analysis (TA) 101'
  | 'Leadership Coaching Certification'
  | 'Performance Coaching Certification'
  | 'Business Coaching Certification'
  | 'Parenting Coach Certification'
  | 'Retirement Coaching Certification'
  | 'ADHD Coaching Certification'
  | 'Nutrition Coaching Certification';

// New: Coaching Languages
export type CoachingLanguage =
  | 'English'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Italian'
  | 'Portuguese'
  | 'Dutch'
  | 'Polish'
  | 'Romanian'
  | 'Greek'
  | 'Swedish'
  | 'Danish'
  | 'Norwegian'
  | 'Finnish'
  | 'Czech'
  | 'Hungarian'
  | 'Bulgarian'
  | 'Croatian'
  | 'Slovak'
  | 'Lithuanian'
  | 'Latvian'
  | 'Estonian'
  | 'Slovenian'
  | 'Arabic'
  | 'Hebrew'
  | 'Turkish'
  | 'Russian'
  | 'Ukrainian'
  | 'Mandarin Chinese'
  | 'Cantonese'
  | 'Japanese'
  | 'Korean'
  | 'Hindi'
  | 'Urdu'
  | 'Bengali'
  | 'Punjabi'
  | 'Tamil'
  | 'Tagalog'
  | 'Vietnamese'
  | 'Thai'
  | 'Indonesian'
  | 'Malay'
  | 'Swahili';

export type AdditionalCertification =
  | 'Mental Health First Aid Trained'
  | 'Trauma Informed'
  | 'Diversity & Inclusion Certified'
  | 'Child & Adolescent Specialist'
  | 'Corporate Coaching Certified'
  | 'NLP Practitioner'
  | 'CBT Trained';

export interface SocialLink {
  id?: string;
  platform: string;
  url: string;
  type?: 'url' | 'email' | 'tel'; // New: identify if it's a URL, email, or telephone
}

export interface Review {
  id: string;
  coachId: string;
  author: string; // First name + last initial (e.g., "John S.")
  authorPhotoUrl?: string;
  rating: number; // 1-5
  text: string;
  isFlagged: boolean;
  date: string;
  isVerifiedClient?: boolean; // Legacy field - now using verificationStatus
  coachReply?: string; // Coach's response to the review
  coachReplyDate?: string; // When the coach replied
  coachingPeriod?: string; // When coaching took place (e.g., "December 2024")
  verificationStatus?: 'unverified' | 'verified' | 'flagged'; // Coach-managed verification
  verifiedAt?: string; // When coach verified the review
  location?: string; // General location of reviewer (e.g., "Cardiff, Wales")
}

export interface Acknowledgement {
  id: string;
  title: string; // e.g. "Author of multiple books", "Coach of the Year 2025"
  icon?: string; // e.g. "star", "trophy", "book"
  year?: number;
}

export interface Qualification {
  id: string;
  degree: string; // e.g. "Masters in Law (MLAW)"
  institution?: string;
  year?: number;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  photoUrl: string;
  specialties: Specialty[];
  bio: string;
  socialLinks: SocialLink[];
  hourlyRate: number;
  yearsExperience: number;
  certifications: string[]; // Legacy field - keeping for backward compatibility
  isVerified: boolean;
  availableFormats: Format[];
  location: string;
  reviews: Review[];
  documentsSubmitted: boolean;

  // New fields from mockup
  accreditationLevel?: AccreditationLevel; // e.g. "Senior Practitioner"
  additionalCertifications?: AdditionalCertification[]; // e.g. ["Mental Health First Aid Trained", "Trauma Informed"]
  coachingHours?: number; // Total hours of coaching experience (e.g. 500)
  locationRadius?: string; // e.g. "within 5 miles of London"
  qualifications?: Qualification[]; // Formal qualifications with degree details
  acknowledgements?: Acknowledgement[]; // Awards, recognitions, achievements
  languages?: string[]; // Legacy - now superseded by coachingLanguages
  averageRating?: number; // Calculated from reviews (1-5)
  totalReviews?: number; // Count of reviews

  // New: Enhanced Expertise & Qualifications
  coachingExpertise?: CoachingExpertise[]; // Areas of coaching expertise (from 7 categories)
  cpdQualifications?: CPDQualification[]; // Additional professional development certifications
  coachingLanguages?: CoachingLanguage[]; // Languages offered for coaching sessions

  // Subscription & Billing
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: string;
  trialUsed?: boolean; // Has user already used their free trial?
  billingCycle: BillingCycle;
  lastPaymentDate?: string;

  // Cancellation Tracking
  cancelledAt?: string; // When user requested cancellation
  subscriptionEndsAt?: string; // When access actually ends (billing period end)
  cancelReason?: string; // Dropdown value from CANCELLATION_REASONS
  cancelFeedback?: string; // Optional text feedback
  dataRetentionPreference?: 'keep' | 'delete'; // User preference for data after cancellation
  scheduledDeletionAt?: string; // When data will be auto-deleted

  // Profile Visibility & Access
  profileVisible?: boolean; // Auto-managed by DB trigger based on subscription status
  dashboardAccess?: boolean; // For future complete lockout (not used yet)

  // Stripe Integration (for future use)
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  // Security
  twoFactorEnabled: boolean;
}

export interface QuestionnaireAnswers {
  goal: Specialty | '';
  sessionsPerMonth: 'one' | 'two' | 'unlimited' | '';
  preferredFormat: Format[];
  budgetRange: number;
  preferredCertifications?: AdditionalCertification[]; // Legacy: Preferred coach certifications
  languagePreferences?: string[]; // Multiple languages (e.g., ["English", "Spanish"])
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'any'; // Preferred coach experience level
  coachingExpertise?: CoachingExpertise[]; // New: Specific coaching areas (80+ options across 7 categories)
  cpdQualifications?: CPDQualification[]; // New: CPD qualifications (40+ certifications)
}

export interface UserState {
  role: 'guest' | 'admin';
  isAuthenticated: boolean;
}
