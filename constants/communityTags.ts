export const COMMUNITY_TAGS = [
  'Career',
  'Business',
  'Leadership',
  'Executive',
  'Life Coaching',
  'Relationships',
  'Mindset',
  'Confidence',
  'Health & Wellness',
  'Stress & Burnout',
  'Wellbeing',
] as const;

export type CommunityTag = typeof COMMUNITY_TAGS[number];

// Tag colours — used for badges on cards and filter chips
export const COMMUNITY_TAG_COLORS: Record<CommunityTag, string> = {
  'Career':           'bg-blue-100 text-blue-700',
  'Business':         'bg-indigo-100 text-indigo-700',
  'Leadership':       'bg-violet-100 text-violet-700',
  'Executive':        'bg-purple-100 text-purple-700',
  'Life Coaching':    'bg-teal-100 text-teal-700',
  'Relationships':    'bg-pink-100 text-pink-700',
  'Mindset':          'bg-amber-100 text-amber-700',
  'Confidence':       'bg-orange-100 text-orange-700',
  'Health & Wellness':'bg-green-100 text-green-700',
  'Stress & Burnout': 'bg-red-100 text-red-700',
  'Wellbeing':        'bg-emerald-100 text-emerald-700',
};

// Keyword → tag mapping for smart search
// A search term matching any entry auto-applies the corresponding tag filter
interface TagKeywordEntry { terms: string[]; tag: CommunityTag; }

export const COMMUNITY_KEYWORD_MAP: TagKeywordEntry[] = [
  { tag: 'Career', terms: ['career', 'job', 'promotion', 'redundancy', 'redundant', 'made redundant', 'laid off', 'layoff', 'retrenchment', 'dismissed', 'fired', 'job loss', 'interview', 'cv', 'resume', 'salary', 'pay', 'wage', 'work', 'profession', 'employment', 'job search', 'career change', 'career advice', 'leaving job', 'new job', 'career break', 'returning to work'] },
  { tag: 'Business', terms: ['business', 'startup', 'entrepreneur', 'company', 'revenue', 'growth', 'sales', 'marketing', 'strategy', 'self employed', 'freelance', 'client', 'pricing'] },
  { tag: 'Leadership', terms: ['leadership', 'leader', 'manage', 'manager', 'team', 'staff', 'delegation', 'culture', 'motivation', 'performance', 'conflict', 'difficult conversations'] },
  { tag: 'Executive', terms: ['executive', 'director', 'senior', 'c-suite', 'ceo', 'board', 'stakeholder', 'corporate', 'strategy', 'vp', 'head of'] },
  { tag: 'Life Coaching', terms: ['life', 'purpose', 'values', 'meaning', 'balance', 'goals', 'habits', 'routine', 'vision', 'clarity', 'focus', 'identity', 'change', 'transition'] },
  { tag: 'Relationships', terms: ['relationship', 'partner', 'family', 'friend', 'communication', 'boundary', 'conflict', 'divorce', 'dating', 'social', 'people', 'trust'] },
  { tag: 'Mindset', terms: ['mindset', 'limiting beliefs', 'negative', 'positive', 'growth mindset', 'fixed mindset', 'thoughts', 'reframe', 'perspective', 'mental', 'attitude'] },
  { tag: 'Confidence', terms: ['confidence', 'confident', 'self esteem', 'self-esteem', 'imposter', 'imposter syndrome', 'self doubt', 'self-doubt', 'assertive', 'assertiveness', 'public speaking', 'presentation', 'worth', 'self worth', 'visibility', 'speaking up', 'shy', 'introvert', 'fear of failure', 'not good enough'] },
  { tag: 'Health & Wellness', terms: ['health', 'wellness', 'fitness', 'sleep', 'nutrition', 'diet', 'exercise', 'body', 'energy', 'chronic', 'illness', 'physical'] },
  { tag: 'Stress & Burnout', terms: ['stress', 'stressed', 'burnout', 'burnt out', 'burned out', 'anxiety', 'anxious', 'overwhelm', 'overwhelmed', 'pressure', 'exhausted', 'exhaustion', 'overworked', 'workload', 'panic', 'nervous', 'tension', 'tired', 'drained', 'depleted', 'cannot cope', 'breaking point'] },
  { tag: 'Wellbeing', terms: ['wellbeing', 'happiness', 'joy', 'fulfillment', 'content', 'gratitude', 'self care', 'mental health', 'emotional', 'resilience', 'calm', 'peace'] },
];

// Returns the best-matching tag for a search string, or null if no match
export function matchSearchToTag(query: string): CommunityTag | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  for (const entry of COMMUNITY_KEYWORD_MAP) {
    if (entry.terms.some(term => q.includes(term) || term.includes(q))) {
      return entry.tag;
    }
  }
  return null;
}
