export type Specialty = 'Career Growth' | 'Stress Relief' | 'Relationships' | 'Health & Wellness' | 'Executive Coaching' | 'General';

export type Format = 'In-Person' | 'Online' | 'Hybrid';

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
  photoUrl: string;
  specialties: Specialty[];
  bio: string;
  hourlyRate: number;
  yearsExperience: number;
  certifications: string[];
  isVerified: boolean; // Admin verification
  availableFormats: Format[];
  location: string;
  reviews: Review[];
  documentsSubmitted: boolean; // For admin flow
}

export interface QuestionnaireAnswers {
  goal: Specialty | '';
  sessionsPerMonth: 'one' | 'two' | 'unlimited' | '';
  preferredFormat: Format[];
  budgetRange: number; // Max hourly rate
}

export interface UserState {
  role: 'guest' | 'admin';
  isAuthenticated: boolean;
}