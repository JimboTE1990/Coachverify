
export type Specialty = 'Career Growth' | 'Stress Relief' | 'Relationships' | 'Health & Wellness' | 'Executive Coaching' | 'General';

export type Format = 'In-Person' | 'Online' | 'Hybrid';

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'onboarding';

export type BillingCycle = 'monthly' | 'annual';

export type AccreditationLevel =
  | 'Foundation'
  | 'Practitioner'
  | 'Senior Practitioner'
  | 'Master Practitioner'
  | 'Certified'
  | 'Advanced Certified';

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
}

export interface Review {
  id: string;
  coachId: string;
  author: string;
  authorPhotoUrl?: string;
  rating: number; // 1-5
  text: string;
  isFlagged: boolean;
  date: string;
  isVerifiedClient?: boolean; // Did they actually book with this coach?
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
  languages?: string[]; // e.g. ["English", "Spanish"]
  averageRating?: number; // Calculated from reviews (1-5)
  totalReviews?: number; // Count of reviews
  
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
  preferredCertifications?: AdditionalCertification[]; // New: Preferred coach certifications
  languagePreferences?: string[]; // New: Multiple languages (e.g., ["English", "Spanish"])
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'any'; // New: Preferred coach experience level
}

export interface UserState {
  role: 'guest' | 'admin';
  isAuthenticated: boolean;
}
