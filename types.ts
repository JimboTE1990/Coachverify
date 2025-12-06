
export type Specialty = 'Career Growth' | 'Stress Relief' | 'Relationships' | 'Health & Wellness' | 'Executive Coaching' | 'General';

export type Format = 'In-Person' | 'Online' | 'Hybrid';

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'onboarding';

export type BillingCycle = 'monthly' | 'annual';

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1-5
  text: string;
  isFlagged: boolean;
  date: string;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string; // New
  photoUrl: string;
  specialties: Specialty[];
  bio: string;
  socialLinks: SocialLink[]; // New
  hourlyRate: number;
  yearsExperience: number;
  certifications: string[];
  isVerified: boolean;
  availableFormats: Format[];
  location: string;
  reviews: Review[];
  documentsSubmitted: boolean;
  
  // Subscription & Billing
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: string;
  billingCycle: BillingCycle; // New
  lastPaymentDate?: string; // New
  
  // Security
  twoFactorEnabled: boolean; // New
}

export interface QuestionnaireAnswers {
  goal: Specialty | '';
  sessionsPerMonth: 'one' | 'two' | 'unlimited' | '';
  preferredFormat: Format[];
  budgetRange: number;
}

export interface UserState {
  role: 'guest' | 'admin';
  isAuthenticated: boolean;
}
