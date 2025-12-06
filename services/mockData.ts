

import { Coach, Review, SubscriptionStatus, SocialLink } from '../types';

// --- CONSTANTS & DEFAULTS ---

// Bumping to coachdog_db_v1 for clean rebrand
const STORAGE_KEY = 'coachdog_db_v1';

const DEFAULT_COACHES: Coach[] = [
  {
    id: 'c1',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah@example.com',
    photoUrl: 'https://picsum.photos/200/200?random=1',
    specialties: ['Career Growth', 'Executive Coaching'],
    bio: 'Helping corporate leaders find balance and accelerate their career paths with 15 years of HR experience.',
    socialLinks: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/sarahjenkins' },
      { platform: 'Website', url: 'https://drjenkins.com' }
    ],
    hourlyRate: 150,
    yearsExperience: 15,
    certifications: ['ICF PCC', 'MBA'],
    isVerified: true,
    availableFormats: ['Online', 'In-Person'],
    location: 'New York, NY',
    documentsSubmitted: true,
    subscriptionStatus: 'active',
    billingCycle: 'monthly',
    lastPaymentDate: '2023-12-01',
    twoFactorEnabled: true,
    reviews: [
      { id: 'r1', author: 'Mike T.', rating: 5, text: 'Sarah changed my life. I got the promotion within 3 months.', isFlagged: false, date: '2023-10-12' },
      { id: 'r2', author: 'Anon', rating: 4, text: 'Great advice, but hard to schedule.', isFlagged: false, date: '2023-11-01' }
    ]
  },
  {
    id: 'c2',
    name: 'Marcus Thorne',
    email: 'marcus@example.com',
    photoUrl: 'https://picsum.photos/200/200?random=2',
    specialties: ['Health & Wellness', 'Stress Relief'],
    bio: 'Holistic approach to stress management through mindfulness and nutrition.',
    socialLinks: [],
    hourlyRate: 80,
    yearsExperience: 5,
    certifications: ['Certified Health Coach', 'Yoga Instructor'],
    isVerified: true,
    availableFormats: ['Online'],
    location: 'Austin, TX',
    documentsSubmitted: true,
    subscriptionStatus: 'active',
    billingCycle: 'annual',
    lastPaymentDate: '2023-01-15',
    twoFactorEnabled: false,
    reviews: [
      { id: 'r3', author: 'Jessica L.', rating: 5, text: 'I feel lighter and happier.', isFlagged: false, date: '2023-09-15' }
    ]
  },
  {
    id: 'c3',
    name: 'Elena Rodriguez',
    email: 'elena@example.com',
    photoUrl: 'https://picsum.photos/200/200?random=3',
    specialties: ['Relationships', 'Stress Relief'],
    bio: 'Navigating complex relationship dynamics with empathy and actionable strategies.',
    socialLinks: [],
    hourlyRate: 120,
    yearsExperience: 8,
    certifications: ['LMFT', 'Relationship Expert'],
    isVerified: false,
    availableFormats: ['Online', 'Hybrid'],
    location: 'Los Angeles, CA',
    documentsSubmitted: true,
    subscriptionStatus: 'trial',
    trialEndsAt: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days left
    billingCycle: 'monthly',
    twoFactorEnabled: false,
    reviews: [
      { id: 'r4', author: 'Tom B.', rating: 2, text: 'Did not click with her style.', isFlagged: true, date: '2023-12-05' }
    ]
  },
  {
    id: 'c4',
    name: 'James O’Connor',
    email: 'james@example.com',
    photoUrl: 'https://picsum.photos/200/200?random=4',
    specialties: ['Career Growth'],
    bio: 'Tech industry veteran helping engineers transition into management.',
    socialLinks: [],
    hourlyRate: 200,
    yearsExperience: 20,
    certifications: ['Agile Coach', 'Leadership Certificate'],
    isVerified: true,
    availableFormats: ['Online'],
    location: 'San Francisco, CA',
    documentsSubmitted: true,
    subscriptionStatus: 'expired',
    billingCycle: 'monthly',
    twoFactorEnabled: false,
    reviews: []
  }
];

// --- INTERNAL STATE ---
let MEMORY_STORE: Coach[] = [];
let isInitialized = false;

// --- CORE FUNCTIONS ---

const initData = (): Coach[] => {
  // If we already have data in memory, return it to prevent thrashing
  if (isInitialized && MEMORY_STORE.length > 0) return MEMORY_STORE;

  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage) {
      const parsed = JSON.parse(fromStorage);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // STRICT SANITIZATION to prevent "Script Error" / Crashes
        const sanitized = parsed
          .filter((c: any) => c !== null && typeof c === 'object') // Filter out nulls
          .map((c: any) => ({
            ...c,
            // Strings - Default to safe empty strings
            id: c.id || `c${Math.random()}`,
            name: c.name || 'Unknown Coach',
            email: c.email || '',
            location: c.location || 'Remote',
            bio: c.bio || '',
            photoUrl: c.photoUrl || 'https://picsum.photos/200/200',
            subscriptionStatus: c.subscriptionStatus || 'onboarding',
            billingCycle: c.billingCycle || 'monthly',
            phoneNumber: c.phoneNumber || '',
            
            // Numbers
            hourlyRate: typeof c.hourlyRate === 'number' ? c.hourlyRate : 0,
            yearsExperience: typeof c.yearsExperience === 'number' ? c.yearsExperience : 0,

            // Arrays - CRITICAL: Ensure these are always arrays
            specialties: Array.isArray(c.specialties) ? c.specialties : [],
            availableFormats: Array.isArray(c.availableFormats) ? c.availableFormats : [],
            certifications: Array.isArray(c.certifications) ? c.certifications : [],
            socialLinks: Array.isArray(c.socialLinks) ? c.socialLinks : [],
            reviews: Array.isArray(c.reviews) ? c.reviews : [],
            
            // Booleans
            isVerified: !!c.isVerified,
            documentsSubmitted: !!c.documentsSubmitted,
            twoFactorEnabled: !!c.twoFactorEnabled,
        }));

        MEMORY_STORE = sanitized;
        isInitialized = true;
        return MEMORY_STORE;
      }
    }
  } catch (e) {
    console.warn("Storage load failed, resetting to defaults", e);
  }

  // Fallback to defaults
  MEMORY_STORE = JSON.parse(JSON.stringify(DEFAULT_COACHES)); // Deep copy to prevent ref issues
  isInitialized = true;
  saveData(); 
  return MEMORY_STORE;
};

const saveData = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MEMORY_STORE));
  } catch (e) {
    console.error("Storage save failed", e);
  }
};

// --- PUBLIC API ---

export const getCoaches = (): Coach[] => {
  return initData();
};

export const getCoachById = (id: string): Coach | undefined => {
  const data = getCoaches();
  return data.find(c => c.id === id);
};

export const updateCoach = (updatedCoach: Coach) => {
  const data = getCoaches();
  const index = data.findIndex(c => c.id === updatedCoach.id);
  
  if (index !== -1) {
    data[index] = updatedCoach;
    MEMORY_STORE = [...data];
    saveData();
  }
};

export const toggleVerifyCoach = (coachId: string) => {
  const data = getCoaches();
  const coach = data.find(c => c.id === coachId);
  if (coach) {
    coach.isVerified = !coach.isVerified;
    if (coach.isVerified) coach.documentsSubmitted = true;
    updateCoach(coach);
  }
  return getCoaches();
};

export const toggleFlagReview = (coachId: string, reviewId: string) => {
    const data = getCoaches();
    const coach = data.find(c => c.id === coachId);
    if(coach) {
        const review = coach.reviews.find(r => r.id === reviewId);
        if(review) {
            review.isFlagged = !review.isFlagged;
            updateCoach(coach);
        }
    }
    return getCoaches();
};

export const registerCoach = (newCoach: Partial<Coach>): Coach => {
  const data = getCoaches();
  const id = `c${Date.now()}`;
  
  const coach: Coach = {
    id,
    name: newCoach.name || 'New Coach',
    email: newCoach.email || '',
    photoUrl: 'https://picsum.photos/200/200?grayscale', 
    specialties: ['General'],
    bio: 'Profile under construction.',
    socialLinks: [],
    hourlyRate: 0,
    yearsExperience: 0,
    certifications: newCoach.certifications || [],
    isVerified: !!newCoach.isVerified,
    availableFormats: ['Online'],
    location: 'Remote',
    reviews: [],
    documentsSubmitted: !!newCoach.isVerified,
    subscriptionStatus: 'onboarding', 
    trialEndsAt: undefined, 
    billingCycle: 'monthly',
    twoFactorEnabled: false,
    ...newCoach
  } as Coach;

  data.push(coach);
  MEMORY_STORE = [...data];
  saveData();
  
  return coach;
};

export const verifyCoachLicense = async (body: string, regNumber: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(body.length > 0 && regNumber.length > 3);
    }, 1000);
  });
};