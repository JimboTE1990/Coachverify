import {
  CoachingLanguage,
  CPDQualification,
  CareerProfessionalExpertise,
  BusinessEntrepreneurshipExpertise,
  HealthWellnessExpertise,
  PersonalLifeExpertise,
  FinancialExpertise,
  NicheDemographicExpertise,
  MethodologyModalityExpertise,
  AdditionalCertification
} from '../types';

// ============================================================
// COACHING LANGUAGES (40+ languages)
// ============================================================

export const COACHING_LANGUAGES: CoachingLanguage[] = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Dutch',
  'Polish',
  'Romanian',
  'Greek',
  'Swedish',
  'Danish',
  'Norwegian',
  'Finnish',
  'Czech',
  'Hungarian',
  'Bulgarian',
  'Croatian',
  'Slovak',
  'Lithuanian',
  'Latvian',
  'Estonian',
  'Slovenian',
  'Arabic',
  'Hebrew',
  'Turkish',
  'Russian',
  'Ukrainian',
  'Mandarin Chinese',
  'Cantonese',
  'Japanese',
  'Korean',
  'Hindi',
  'Urdu',
  'Bengali',
  'Punjabi',
  'Tamil',
  'Tagalog',
  'Vietnamese',
  'Thai',
  'Indonesian',
  'Malay',
  'Swahili'
];

// ============================================================
// CPD QUALIFICATIONS (40+ certifications)
// ============================================================

export const CPD_QUALIFICATIONS: CPDQualification[] = [
  'Mental Health First Aid (MHFA)',
  'Trauma-Informed Coaching Certificate',
  'Diversity & Inclusion Coaching Certificate',
  'Corporate Coaching Certification',
  'Team Coaching Certification',
  'Career Coaching Certification',
  'Executive Coaching Certification',
  'Health & Wellness Coaching Certification',
  'Relationship Coaching Certification',
  'NLP Practitioner Certification',
  'Leadership Coaching Certification',
  'Performance Coaching Certification',
  'Business Coaching Certification',
  'Parenting Coach Certification',
  'ADHD Coaching Certification',
  'Nutrition Coaching Certification',
  'Neuro-affirmed Coaching Certification',
  'Certified in Ethical Application of AI',
];

// ============================================================
// COACHING EXPERTISE BY CATEGORY (80+ areas)
// ============================================================

export interface ExpertiseCategory {
  name: string;
  icon: string;
  description: string;
  items: string[];
}

export const CAREER_PROFESSIONAL: CareerProfessionalExpertise[] = [
  'Career Transition',
  'Leadership Development',
  'Executive Coaching',
  'Team Coaching',
  'Performance Coaching',
  'Communication Skills',
  'Public Speaking',
  'Interview Preparation',
  'Networking',
  'Personal Branding',
  'Work-Life Balance',
  'Time Management',
  'Productivity',
  'Confidence Building'
];

export const BUSINESS_ENTREPRENEURSHIP: BusinessEntrepreneurshipExpertise[] = [
  'Business Start-up',
  'Business Growth & Scaling',
  'Strategic Planning',
  'Sales Coaching',
  'Marketing & Branding',
  'Negotiation Skills',
  'Innovation & Creativity',
  'Succession Planning'
];

export const HEALTH_WELLNESS: HealthWellnessExpertise[] = [
  'Stress Management',
  'Mindfulness & Meditation',
  'Sleep Improvement',
  'Nutrition & Healthy Eating',
  'Fitness & Exercise',
  'Weight Management',
  'Chronic Illness Management',
  'Mental Health & Wellbeing',
  'Addiction Recovery',
  'Grief & Loss',
  'Burnout Recovery'
];

export const PERSONAL_LIFE: PersonalLifeExpertise[] = [
  'Life Purpose & Meaning',
  'Goal Setting & Achievement',
  'Relationship Coaching',
  'Parenting',
  'Family Dynamics',
  'Divorce & Separation',
  'Self-Esteem & Confidence',
  'Personal Growth',
  'Spiritual Development',
  'Retirement Planning (Life)',
  'Lifestyle Design',
  'Creative Expression'
];

export const FINANCIAL: FinancialExpertise[] = [
  'Financial Planning & Budgeting',
  'Debt Management',
  'Investment Coaching',
  'Retirement Planning (Financial)',
  'Money Mindset'
];

export const NICHE_DEMOGRAPHIC: NicheDemographicExpertise[] = [
  'LGBTQ+ Coaching',
  'Neurodiversity (ADHD, Autism, etc.)',
  'Youth & Students (Ages 16-25)',
  'Mid-Career Professionals',
  'Senior Professionals (50+)',
  'Women in Leadership',
  'Veterans & Military Transition',
  'Expats & Relocation',
  'Artists & Creatives',
  'Athletes & Sports Performance'
];

export const METHODOLOGY_MODALITY: MethodologyModalityExpertise[] = [
  'Cognitive Behavioral Coaching (CBC)',
  'Neuro-Linguistic Programming (NLP)',
  'Solution-Focused Coaching',
  'Positive Psychology',
  'Ontological Coaching',
  'Systemic Coaching',
  'Gestalt Coaching',
  'Psychodynamic Coaching',
  'Narrative Coaching',
  'Somatic Coaching',
  'Mindfulness-Based Coaching',
  'Acceptance and Commitment Therapy (ACT)',
  'Transactional Analysis (TA)'
];

// Organized by category with metadata
export const EXPERTISE_CATEGORIES: ExpertiseCategory[] = [
  {
    name: 'Career & Professional Development',
    icon: '🎯',
    description: 'Career growth, leadership, and professional skills',
    items: CAREER_PROFESSIONAL
  },
  {
    name: 'Business & Entrepreneurship',
    icon: '💼',
    description: 'Business strategy, sales, and entrepreneurship',
    items: BUSINESS_ENTREPRENEURSHIP
  },
  {
    name: 'Health & Wellness',
    icon: '🧘',
    description: 'Physical and mental wellbeing',
    items: HEALTH_WELLNESS
  },
  {
    name: 'Personal & Life',
    icon: '🌱',
    description: 'Life purpose, relationships, and personal growth',
    items: PERSONAL_LIFE
  },
  {
    name: 'Financial',
    icon: '💰',
    description: 'Money management and financial planning',
    items: FINANCIAL
  },
  {
    name: 'Niche & Demographic',
    icon: '👥',
    description: 'Specialized coaching for specific groups',
    items: NICHE_DEMOGRAPHIC
  },
  {
    name: 'Methodology & Modality',
    icon: '🔬',
    description: 'Specific coaching approaches and frameworks',
    items: METHODOLOGY_MODALITY
  }
];

// ============================================================
// LEGACY CERTIFICATIONS (for backward compatibility)
// ============================================================

export const ADDITIONAL_CERTIFICATIONS: AdditionalCertification[] = [
  'Mental Health First Aid Trained',
  'Trauma Informed',
  'Diversity & Inclusion Certified',
  'Child & Adolescent Specialist',
  'Corporate Coaching Certified',
  'NLP Practitioner',
  'CBT Trained'
];
