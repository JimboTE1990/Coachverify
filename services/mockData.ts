import { Coach, Review } from '../types';

const INITIAL_COACHES: Coach[] = [
  {
    id: 'c1',
    name: 'Dr. Sarah Jenkins',
    photoUrl: 'https://picsum.photos/200/200?random=1',
    specialties: ['Career Growth', 'Executive Coaching'],
    bio: 'Helping corporate leaders find balance and accelerate their career paths with 15 years of HR experience.',
    hourlyRate: 150,
    yearsExperience: 15,
    certifications: ['ICF PCC', 'MBA'],
    isVerified: true,
    availableFormats: ['Online', 'In-Person'],
    location: 'New York, NY',
    documentsSubmitted: true,
    reviews: [
      { id: 'r1', author: 'Mike T.', rating: 5, text: 'Sarah changed my life. I got the promotion within 3 months.', isFlagged: false, date: '2023-10-12' },
      { id: 'r2', author: 'Anon', rating: 4, text: 'Great advice, but hard to schedule.', isFlagged: false, date: '2023-11-01' }
    ]
  },
  {
    id: 'c2',
    name: 'Marcus Thorne',
    photoUrl: 'https://picsum.photos/200/200?random=2',
    specialties: ['Health & Wellness', 'Stress Relief'],
    bio: 'Holistic approach to stress management through mindfulness and nutrition.',
    hourlyRate: 80,
    yearsExperience: 5,
    certifications: ['Certified Health Coach', 'Yoga Instructor'],
    isVerified: true,
    availableFormats: ['Online'],
    location: 'Austin, TX',
    documentsSubmitted: true,
    reviews: [
      { id: 'r3', author: 'Jessica L.', rating: 5, text: 'I feel lighter and happier.', isFlagged: false, date: '2023-09-15' }
    ]
  },
  {
    id: 'c3',
    name: 'Elena Rodriguez',
    photoUrl: 'https://picsum.photos/200/200?random=3',
    specialties: ['Relationships', 'Stress Relief'],
    bio: 'Navigating complex relationship dynamics with empathy and actionable strategies.',
    hourlyRate: 120,
    yearsExperience: 8,
    certifications: ['LMFT', 'Relationship Expert'],
    isVerified: false,
    availableFormats: ['Online', 'Hybrid'],
    location: 'Los Angeles, CA',
    documentsSubmitted: true,
    reviews: [
      { id: 'r4', author: 'Tom B.', rating: 2, text: 'Did not click with her style.', isFlagged: true, date: '2023-12-05' } // Flagged example
    ]
  },
  {
    id: 'c4',
    name: 'James O’Connor',
    photoUrl: 'https://picsum.photos/200/200?random=4',
    specialties: ['Career Growth'],
    bio: 'Tech industry veteran helping engineers transition into management.',
    hourlyRate: 200,
    yearsExperience: 20,
    certifications: ['Agile Coach', 'Leadership Certificate'],
    isVerified: true,
    availableFormats: ['Online'],
    location: 'San Francisco, CA',
    documentsSubmitted: true,
    reviews: []
  },
  {
    id: 'c5',
    name: 'Linda Wheatley',
    photoUrl: 'https://picsum.photos/200/200?random=5',
    specialties: ['Health & Wellness', 'Relationships'],
    bio: 'Helping you find love for yourself and others.',
    hourlyRate: 60,
    yearsExperience: 3,
    certifications: ['Life Coach 101'],
    isVerified: false,
    availableFormats: ['In-Person'],
    location: 'Chicago, IL',
    documentsSubmitted: false, // Needs upload
    reviews: []
  }
];

const STORAGE_KEY = 'coachverify_data_v1';

export const getCoaches = (): Coach[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COACHES));
    return INITIAL_COACHES;
  }
  return JSON.parse(stored);
};

export const getCoachById = (id: string): Coach | undefined => {
  const coaches = getCoaches();
  return coaches.find(c => c.id === id);
};

export const updateCoach = (updatedCoach: Coach) => {
  const coaches = getCoaches();
  const index = coaches.findIndex(c => c.id === updatedCoach.id);
  if (index !== -1) {
    coaches[index] = updatedCoach;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coaches));
  }
};

export const toggleVerifyCoach = (coachId: string) => {
  const coaches = getCoaches();
  const coach = coaches.find(c => c.id === coachId);
  if (coach) {
    coach.isVerified = !coach.isVerified;
    // Mock auto-verify logic (usually would be separate steps)
    if (coach.isVerified && !coach.documentsSubmitted) {
        coach.documentsSubmitted = true; 
    }
    updateCoach(coach);
  }
  return getCoaches();
};

export const toggleFlagReview = (coachId: string, reviewId: string) => {
    const coaches = getCoaches();
    const coach = coaches.find(c => c.id === coachId);
    if(coach) {
        const review = coach.reviews.find(r => r.id === reviewId);
        if(review) {
            review.isFlagged = !review.isFlagged;
            updateCoach(coach);
        }
    }
    return getCoaches();
}