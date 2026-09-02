import { CoachingExpertise } from '../types';

// ─── Stop words stripped before bio search ───────────────────────────────────
const STOP_WORDS = new Set([
  'i','me','my','am','is','are','was','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might','shall',
  'can','a','an','the','and','but','or','nor','for','so','yet','at','by','in',
  'of','on','to','up','as','it','its','that','this','with','from','into','how',
  'what','where','when','who','which','not','no','than','then','them','they',
  'their','there','here','looking','need','want','help','support','going',
  'through','about','some','any','just','like','more','also','get','find',
  'someone','something','feel','feeling','really','very','much','bit','little',
  'im','ive','id','dont','cant','wont','isnt','arent','wasnt','werent',
  'going','through','some','trying','make','think','feel','really','bit',
  'working','work','things','time','life','way','new','good','better','best',
  'please','thank','thanks','hello','hi','hey','okay','ok','yes','no',
]);

// ─── Keyword → expertise tag map ─────────────────────────────────────────────
// Values must be exact CoachingExpertise string literals from constants/filterOptions.ts
type Tag = CoachingExpertise;

const KEYWORD_MAP: Record<string, Tag[]> = {
  // DIVORCE & SEPARATION
  'divorce':          ['Divorce & Separation', 'Relationship Coaching', 'Life Purpose & Meaning'],
  'divorced':         ['Divorce & Separation', 'Relationship Coaching'],
  'separation':       ['Divorce & Separation', 'Relationship Coaching'],
  'separated':        ['Divorce & Separation', 'Relationship Coaching'],
  'breakup':          ['Relationship Coaching', 'Self-Esteem & Confidence'],
  'break up':         ['Relationship Coaching', 'Self-Esteem & Confidence'],
  'break-up':         ['Relationship Coaching', 'Self-Esteem & Confidence'],
  'split up':         ['Divorce & Separation', 'Relationship Coaching'],
  'splitting up':     ['Divorce & Separation', 'Relationship Coaching'],
  'marriage':         ['Relationship Coaching', 'Family Dynamics'],
  'married':          ['Relationship Coaching'],
  'partner':          ['Relationship Coaching', 'Family Dynamics'],

  // GRIEF & LOSS
  'grief':            ['Grief & Loss'],
  'grieving':         ['Grief & Loss'],
  'bereavement':      ['Grief & Loss'],
  'bereaved':         ['Grief & Loss'],
  'mourning':         ['Grief & Loss'],
  'loss':             ['Grief & Loss', 'Life Purpose & Meaning'],
  'death':            ['Grief & Loss'],
  'died':             ['Grief & Loss'],
  'passed away':      ['Grief & Loss'],
  'lost someone':     ['Grief & Loss'],

  // NEURODIVERSITY
  'autism':           ['Neurodiversity (ADHD, Autism, etc.)', 'Late-Diagnosed Neurodivergent Adults'],
  'autistic':         ['Neurodiversity (ADHD, Autism, etc.)', 'Late-Diagnosed Neurodivergent Adults'],
  'asd':              ['Neurodiversity (ADHD, Autism, etc.)'],
  'adhd':             ['Neurodiversity (ADHD, Autism, etc.)', 'Late-Diagnosed Neurodivergent Adults'],
  'add':              ['Neurodiversity (ADHD, Autism, etc.)'],
  'neurodivergent':   ['Neurodiversity (ADHD, Autism, etc.)', 'Late-Diagnosed Neurodivergent Adults'],
  'neurodiversity':   ['Neurodiversity (ADHD, Autism, etc.)'],
  'dyslexia':         ['Neurodiversity (ADHD, Autism, etc.)'],
  'dyslexic':         ['Neurodiversity (ADHD, Autism, etc.)'],
  'dyspraxia':        ['Neurodiversity (ADHD, Autism, etc.)'],
  'dyscalculia':      ['Neurodiversity (ADHD, Autism, etc.)'],
  'aspergers':        ['Neurodiversity (ADHD, Autism, etc.)'],
  'asperger':         ['Neurodiversity (ADHD, Autism, etc.)'],
  'late diagnosis':   ['Late-Diagnosed Neurodivergent Adults', 'Neurodiversity (ADHD, Autism, etc.)'],
  'late diagnosed':   ['Late-Diagnosed Neurodivergent Adults', 'Neurodiversity (ADHD, Autism, etc.)'],
  'newly diagnosed':  ['Late-Diagnosed Neurodivergent Adults', 'Neurodiversity (ADHD, Autism, etc.)'],
  'diagnosis':        ['Late-Diagnosed Neurodivergent Adults', 'Neurodiversity (ADHD, Autism, etc.)'],
  'diagnosed':        ['Late-Diagnosed Neurodivergent Adults', 'Neurodiversity (ADHD, Autism, etc.)'],
  'sensory':          ['Neurodiversity (ADHD, Autism, etc.)'],

  // MENTAL HEALTH
  'anxiety':          ['Stress Management', 'Mental Health & Wellbeing'],
  'anxious':          ['Stress Management', 'Mental Health & Wellbeing'],
  'panic':            ['Stress Management', 'Mental Health & Wellbeing'],
  'panic attacks':    ['Stress Management', 'Mental Health & Wellbeing'],
  'depression':       ['Mental Health & Wellbeing'],
  'depressed':        ['Mental Health & Wellbeing'],
  'mental health':    ['Mental Health & Wellbeing'],
  'wellbeing':        ['Mental Health & Wellbeing'],
  'burnout':          ['Burnout Recovery', 'Stress Management', 'Work-Life Balance'],
  'burned out':       ['Burnout Recovery', 'Stress Management'],
  'burnt out':        ['Burnout Recovery', 'Stress Management'],
  'exhausted':        ['Burnout Recovery', 'Stress Management'],
  'overwhelmed':      ['Stress Management', 'Burnout Recovery'],
  'stress':           ['Stress Management', 'Mental Health & Wellbeing'],
  'stressed':         ['Stress Management'],
  'trauma':           ['Mental Health & Wellbeing'],
  'traumatic':        ['Mental Health & Wellbeing'],
  'ptsd':             ['Mental Health & Wellbeing'],
  'ocd':              ['Mental Health & Wellbeing'],
  'eating disorder':  ['Mental Health & Wellbeing', 'Nutrition & Healthy Eating'],
  'self harm':        ['Mental Health & Wellbeing'],
  'suicidal':         ['Mental Health & Wellbeing'],
  'addiction':        ['Addiction Recovery'],
  'alcohol':          ['Addiction Recovery'],
  'sobriety':         ['Addiction Recovery'],
  'sober':            ['Addiction Recovery'],
  'substance':        ['Addiction Recovery'],
  'drugs':            ['Addiction Recovery'],
  'gambling':         ['Addiction Recovery'],

  // CAREER
  'redundancy':       ['Career Transition'],
  'redundant':        ['Career Transition'],
  'laid off':         ['Career Transition'],
  'job loss':         ['Career Transition'],
  'lost my job':      ['Career Transition'],
  'career change':    ['Career Transition'],
  'career transition':['Career Transition'],
  'career switch':    ['Career Transition'],
  'new career':       ['Career Transition'],
  'changing careers': ['Career Transition'],
  'job search':       ['Career Transition', 'Interview Preparation'],
  'new job':          ['Career Transition', 'Interview Preparation'],
  'job hunting':      ['Career Transition', 'Interview Preparation'],
  'interview':        ['Interview Preparation'],
  'interviews':       ['Interview Preparation'],
  'cv':               ['Interview Preparation', 'Personal Branding'],
  'resume':           ['Interview Preparation', 'Personal Branding'],
  'promotion':        ['Leadership Development', 'Career Transition', 'Confidence Building'],
  'promoted':         ['Leadership Development', 'Career Transition'],
  'senior role':      ['Leadership Development', 'Executive Coaching'],
  'leadership':       ['Leadership Development', 'Executive Coaching'],
  'leader':           ['Leadership Development'],
  'leading':          ['Leadership Development'],
  'manager':          ['Leadership Development', 'Team Coaching'],
  'management':       ['Leadership Development', 'Team Coaching'],
  'managing people':  ['Leadership Development', 'Team Coaching'],
  'team leader':      ['Leadership Development', 'Team Coaching'],
  'executive':        ['Executive Coaching', 'Leadership Development'],
  'c-suite':          ['Executive Coaching', 'Leadership Development'],
  'director':         ['Executive Coaching', 'Leadership Development'],
  'public speaking':  ['Public Speaking', 'Communication Skills'],
  'presenting':       ['Public Speaking', 'Communication Skills'],
  'presentations':    ['Public Speaking', 'Communication Skills'],
  'speaking':         ['Public Speaking', 'Communication Skills'],
  'networking':       ['Networking', 'Personal Branding'],
  'personal brand':   ['Personal Branding', 'Networking'],
  'branding':         ['Personal Branding'],
  'productivity':     ['Productivity', 'Time Management'],
  'procrastination':  ['Productivity', 'Time Management'],
  'procrastinating':  ['Productivity', 'Time Management'],
  'time management':  ['Time Management', 'Productivity'],
  'organised':        ['Time Management', 'Productivity'],
  'organized':        ['Time Management', 'Productivity'],
  'work life balance':['Work-Life Balance'],
  'worklife':         ['Work-Life Balance'],
  'overworked':       ['Work-Life Balance', 'Burnout Recovery'],
  'performance':      ['Performance Coaching'],
  'confidence':       ['Confidence Building', 'Self-Esteem & Confidence'],
  'imposter':         ['Confidence Building', 'Self-Esteem & Confidence'],
  'imposter syndrome':['Confidence Building', 'Self-Esteem & Confidence'],
  'self esteem':      ['Self-Esteem & Confidence', 'Confidence Building'],
  'communication':    ['Communication Skills'],

  // BUSINESS
  'startup':          ['Business Start-up', 'Business Growth & Scaling'],
  'start up':         ['Business Start-up', 'Business Growth & Scaling'],
  'start-up':         ['Business Start-up', 'Business Growth & Scaling'],
  'entrepreneur':     ['Business Start-up', 'Business Growth & Scaling'],
  'entrepreneurship': ['Business Start-up', 'Business Growth & Scaling'],
  'business owner':   ['Business Start-up', 'Business Growth & Scaling', 'Strategic Planning'],
  'own business':     ['Business Start-up', 'Business Growth & Scaling'],
  'my business':      ['Business Start-up', 'Business Growth & Scaling'],
  'small business':   ['Business Start-up', 'Business Growth & Scaling'],
  'freelancer':       ['Business Start-up', 'Personal Branding'],
  'freelance':        ['Business Start-up', 'Personal Branding'],
  'self employed':    ['Business Start-up'],
  'self-employed':    ['Business Start-up'],
  'sales':            ['Sales Coaching', 'Business Growth & Scaling'],
  'selling':          ['Sales Coaching'],
  'scaling':          ['Business Growth & Scaling', 'Strategic Planning'],
  'growth':           ['Business Growth & Scaling', 'Strategic Planning'],
  'strategy':         ['Strategic Planning'],
  'strategic':        ['Strategic Planning'],
  'negotiation':      ['Negotiation Skills'],
  'negotiate':        ['Negotiation Skills'],
  'negotiating':      ['Negotiation Skills'],
  'innovation':       ['Innovation & Creativity'],
  'creative':         ['Innovation & Creativity', 'Creative Expression'],
  'creativity':       ['Innovation & Creativity', 'Creative Expression'],
  'marketing':        ['Marketing & Branding', 'Personal Branding'],
  'succession':       ['Succession Planning'],

  // HEALTH & WELLNESS
  'menopause':        ['Menopause & Hormonal Health'],
  'menopausal':       ['Menopause & Hormonal Health'],
  'perimenopause':    ['Menopause & Hormonal Health'],
  'hormones':         ['Menopause & Hormonal Health'],
  'hormonal':         ['Menopause & Hormonal Health'],
  'hot flushes':      ['Menopause & Hormonal Health'],
  'hot flashes':      ['Menopause & Hormonal Health'],
  'weight':           ['Weight Management', 'Nutrition & Healthy Eating', 'Fitness & Exercise'],
  'weight loss':      ['Weight Management', 'Nutrition & Healthy Eating'],
  'nutrition':        ['Nutrition & Healthy Eating'],
  'diet':             ['Nutrition & Healthy Eating'],
  'eating':           ['Nutrition & Healthy Eating'],
  'healthy eating':   ['Nutrition & Healthy Eating'],
  'fitness':          ['Fitness & Exercise'],
  'exercise':         ['Fitness & Exercise'],
  'gym':              ['Fitness & Exercise'],
  'active':           ['Fitness & Exercise'],
  'sleep':            ['Sleep Improvement'],
  'sleeping':         ['Sleep Improvement'],
  'insomnia':         ['Sleep Improvement'],
  'mindfulness':      ['Mindfulness & Meditation', 'Mindfulness-Based Coaching'],
  'meditation':       ['Mindfulness & Meditation', 'Mindfulness-Based Coaching'],
  'chronic illness':  ['Chronic Illness Management'],
  'chronic pain':     ['Chronic Illness Management'],
  'long term illness':['Chronic Illness Management'],
  'disability':       ['Chronic Illness Management'],

  // PERSONAL & LIFE
  'purpose':          ['Life Purpose & Meaning', 'Personal Growth'],
  'meaning':          ['Life Purpose & Meaning', 'Personal Growth'],
  'direction':        ['Life Purpose & Meaning', 'Goal Setting & Achievement'],
  'lost':             ['Life Purpose & Meaning', 'Personal Growth'],
  'goals':            ['Goal Setting & Achievement'],
  'goal setting':     ['Goal Setting & Achievement'],
  'achieve':          ['Goal Setting & Achievement'],
  'ambitions':        ['Goal Setting & Achievement'],
  'relationship':     ['Relationship Coaching', 'Family Dynamics'],
  'relationships':    ['Relationship Coaching'],
  'dating':           ['Relationship Coaching'],
  'love':             ['Relationship Coaching'],
  'parenting':        ['Parenting', 'Family Dynamics'],
  'parent':           ['Parenting', 'Family Dynamics'],
  'children':         ['Parenting', 'Family Dynamics'],
  'kids':             ['Parenting', 'Family Dynamics'],
  'baby':             ['Parenting', 'Family Dynamics'],
  'toddler':          ['Parenting', 'Family Dynamics'],
  'family':           ['Family Dynamics', 'Parenting'],
  'spiritual':        ['Spiritual Development'],
  'spirituality':     ['Spiritual Development'],
  'faith':            ['Spiritual Development'],
  'retirement':       ['Retirement Planning (Life)', 'Retirement Planning (Financial)'],
  'retiring':         ['Retirement Planning (Life)', 'Retirement Planning (Financial)'],
  'retired':          ['Retirement Planning (Life)'],
  'lifestyle':        ['Lifestyle Design', 'Personal Growth'],
  'life design':      ['Lifestyle Design'],
  'personal growth':  ['Personal Growth', 'Life Purpose & Meaning'],
  'self improvement': ['Personal Growth', 'Goal Setting & Achievement'],
  'self development': ['Personal Growth', 'Goal Setting & Achievement'],
  'artist':           ['Creative Expression', 'Artists & Creatives'],
  'creative writing': ['Creative Expression'],

  // FINANCIAL
  'financial':        ['Financial Planning & Budgeting'],
  'money':            ['Money Mindset', 'Financial Planning & Budgeting'],
  'debt':             ['Debt Management'],
  'budgeting':        ['Financial Planning & Budgeting'],
  'budget':           ['Financial Planning & Budgeting'],
  'savings':          ['Financial Planning & Budgeting'],
  'investing':        ['Investment Coaching'],
  'investment':       ['Investment Coaching'],
  'stocks':           ['Investment Coaching'],
  'money mindset':    ['Money Mindset'],
  'financial freedom':['Money Mindset', 'Financial Planning & Budgeting'],

  // DEMOGRAPHICS / SPECIALIST
  'lgbtq':            ['LGBTQ+ Coaching'],
  'lgbt':             ['LGBTQ+ Coaching'],
  'gay':              ['LGBTQ+ Coaching'],
  'lesbian':          ['LGBTQ+ Coaching'],
  'trans':            ['LGBTQ+ Coaching'],
  'transgender':      ['LGBTQ+ Coaching'],
  'queer':            ['LGBTQ+ Coaching'],
  'non binary':       ['LGBTQ+ Coaching'],
  'nonbinary':        ['LGBTQ+ Coaching'],
  'bisexual':         ['LGBTQ+ Coaching'],
  'young person':     ['Youth & Students (Ages 16-25)'],
  'young adult':      ['Youth & Students (Ages 16-25)'],
  'student':          ['Youth & Students (Ages 16-25)'],
  'graduate':         ['Youth & Students (Ages 16-25)', 'Career Transition'],
  'university':       ['Youth & Students (Ages 16-25)'],
  'sixth form':       ['Youth & Students (Ages 16-25)'],
  'teenager':         ['Youth & Students (Ages 16-25)'],
  'mid career':       ['Mid-Career Professionals', 'Career Transition'],
  'mid-career':       ['Mid-Career Professionals'],
  'over 50':          ['Senior Professionals (50+)'],
  'over 60':          ['Senior Professionals (50+)'],
  'senior professional':['Senior Professionals (50+)'],
  'women leadership': ['Women in Leadership'],
  'female leader':    ['Women in Leadership'],
  'women in leadership':['Women in Leadership'],
  'veteran':          ['Veterans & Military Transition'],
  'military':         ['Veterans & Military Transition'],
  'armed forces':     ['Veterans & Military Transition'],
  'expat':            ['Expats & Relocation'],
  'expatriate':       ['Expats & Relocation'],
  'relocation':       ['Expats & Relocation'],
  'relocated':        ['Expats & Relocation'],
  'moved country':    ['Expats & Relocation'],
  'moved abroad':     ['Expats & Relocation'],
  'living abroad':    ['Expats & Relocation'],
  'musician':         ['Artists & Creatives'],
  'athlete':          ['Athletes & Sports Performance'],
  'sport':            ['Athletes & Sports Performance'],
  'sports':           ['Athletes & Sports Performance'],
  'performance sport':['Athletes & Sports Performance'],

  // METHODOLOGY (when clients explicitly mention these)
  'nlp':              ['Neuro-Linguistic Programming (NLP)'],
  'cbt':              ['Cognitive Behavioral Coaching (CBC)'],
  'cognitive':        ['Cognitive Behavioral Coaching (CBC)', 'Solution-Focused Coaching'],
  'somatic':          ['Somatic Coaching'],
  'positive psychology':['Positive Psychology'],
  'mindset':          ['Positive Psychology', 'Personal Growth'],
  'solution focused': ['Solution-Focused Coaching'],
  'narrative':        ['Narrative Coaching'],
  'gestalt':          ['Gestalt Coaching'],
  'transactional':    ['Transactional Analysis (TA)'],
  'act therapy':      ['Acceptance and Commitment Therapy (ACT)'],
  'acceptance':       ['Acceptance and Commitment Therapy (ACT)'],

  // MOTIVATION & DIRECTION
  'motivation':       ['Goal Setting & Achievement', 'Personal Growth', 'Performance Coaching'],
  'motivated':        ['Goal Setting & Achievement', 'Personal Growth'],
  'unmotivated':      ['Goal Setting & Achievement', 'Personal Growth'],
  'stuck':            ['Life Purpose & Meaning', 'Goal Setting & Achievement', 'Personal Growth'],
  'feeling stuck':    ['Life Purpose & Meaning', 'Goal Setting & Achievement'],
  'feeling lost':     ['Life Purpose & Meaning', 'Personal Growth'],
  'no direction':     ['Life Purpose & Meaning', 'Goal Setting & Achievement'],
  'clarity':          ['Life Purpose & Meaning', 'Goal Setting & Achievement'],
  'passion':          ['Life Purpose & Meaning', 'Personal Growth'],
  'fulfillment':      ['Life Purpose & Meaning', 'Personal Growth'],
  'fulfilment':       ['Life Purpose & Meaning', 'Personal Growth'],
  'identity':         ['Personal Growth', 'Life Purpose & Meaning'],
  'transition':       ['Career Transition', 'Life Purpose & Meaning'],
  'change':           ['Personal Growth', 'Life Purpose & Meaning', 'Career Transition'],
  'success':          ['Goal Setting & Achievement', 'Performance Coaching'],
  'habits':           ['Goal Setting & Achievement', 'Productivity'],
  'habit':            ['Goal Setting & Achievement', 'Productivity'],
  'focus':            ['Productivity', 'Neurodiversity (ADHD, Autism, etc.)'],
  'self confidence':  ['Confidence Building', 'Self-Esteem & Confidence'],

  // EMOTIONAL / WELLBEING
  'unhappy':          ['Mental Health & Wellbeing', 'Personal Growth', 'Life Purpose & Meaning'],
  'frustrated':       ['Stress Management', 'Personal Growth'],
  'frustration':      ['Stress Management', 'Personal Growth'],
  'lonely':           ['Mental Health & Wellbeing', 'Relationship Coaching'],
  'loneliness':       ['Mental Health & Wellbeing'],
  'isolated':         ['Mental Health & Wellbeing'],
  'empty':            ['Life Purpose & Meaning', 'Mental Health & Wellbeing'],
  'emptiness':        ['Life Purpose & Meaning', 'Mental Health & Wellbeing'],
  'fear':             ['Confidence Building', 'Mental Health & Wellbeing'],
  'scared':           ['Confidence Building', 'Mental Health & Wellbeing'],
  'uncertain':        ['Life Purpose & Meaning', 'Confidence Building'],
  'unsure':           ['Life Purpose & Meaning', 'Confidence Building'],
  'overthinking':     ['Stress Management', 'Mindfulness & Meditation'],
  'overthink':        ['Stress Management', 'Mindfulness & Meditation'],
  'anger':            ['Mental Health & Wellbeing', 'Stress Management'],
  'angry':            ['Mental Health & Wellbeing', 'Stress Management'],
  'resilience':       ['Mental Health & Wellbeing', 'Stress Management'],
  'resilient':        ['Mental Health & Wellbeing', 'Stress Management'],
  'overwhelm':        ['Stress Management', 'Burnout Recovery'],
  'hopeless':         ['Mental Health & Wellbeing', 'Personal Growth'],
  'helpless':         ['Mental Health & Wellbeing', 'Confidence Building'],
  'low confidence':   ['Confidence Building', 'Self-Esteem & Confidence'],
  'low self esteem':  ['Self-Esteem & Confidence', 'Confidence Building'],
};

// ─── Public API ───────────────────────────────────────────────────────────────

export interface NlSearchResult {
  matchedExpertise: CoachingExpertise[];
  searchKeywords: string[];
}

/**
 * Layer 1: parse natural language → structured expertise tags + clean keywords for bio search.
 * Checks single tokens AND bigrams (two-word phrases) against the keyword map.
 */
export function parseNaturalLanguageQuery(text: string): NlSearchResult {
  if (!text.trim()) return { matchedExpertise: [], searchKeywords: [] };

  const lower = text.toLowerCase().replace(/['']/g, '');
  const tokens = lower.split(/[\s,;.!?]+/).filter(Boolean);

  const tagSet = new Set<CoachingExpertise>();

  // Check single tokens
  for (const token of tokens) {
    const matches = KEYWORD_MAP[token];
    if (matches) matches.forEach(t => tagSet.add(t));
  }

  // Check bigrams (two consecutive tokens joined by space)
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`;
    const matches = KEYWORD_MAP[bigram];
    if (matches) matches.forEach(t => tagSet.add(t));
  }

  // Check trigrams for longer phrases (three consecutive tokens)
  for (let i = 0; i < tokens.length - 2; i++) {
    const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
    const matches = KEYWORD_MAP[trigram];
    if (matches) matches.forEach(t => tagSet.add(t));
  }

  // Clean keywords for Layer 2 bio search (strip stop words, keep 3+ char tokens)
  const searchKeywords = tokens.filter(t => t.length >= 3 && !STOP_WORDS.has(t));

  return {
    matchedExpertise: Array.from(tagSet),
    searchKeywords,
  };
}

/**
 * Layer 2: score a coach's profile text against the cleaned search keywords.
 * Bio hits are weighted highest; expertise/CPD text hits add a smaller bonus.
 * Returns 0 when no keywords are provided.
 */
export function scoreCoachAgainstQuery(
  coach: {
    bio?: string;
    coachingExpertise?: string[];
    cpdQualifications?: string[];
    mainCoachingCategories?: string[];
  },
  keywords: string[]
): number {
  if (keywords.length === 0) return 0;

  const bioText = (coach.bio || '').toLowerCase();
  const expertiseText = (coach.coachingExpertise || []).join(' ').toLowerCase();
  const cpdText = (coach.cpdQualifications || []).join(' ').toLowerCase();
  const categoryText = (coach.mainCoachingCategories || []).join(' ').toLowerCase();

  let score = 0;
  for (const keyword of keywords) {
    const k = keyword.toLowerCase();
    if (bioText.includes(k)) score += 2;
    if (expertiseText.includes(k)) score += 1;
    if (cpdText.includes(k)) score += 0.5;
    if (categoryText.includes(k)) score += 0.5;
  }

  return score;
}
