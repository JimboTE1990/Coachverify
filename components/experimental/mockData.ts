// DEV POC — hardcoded mock data, zero DB queries

export interface MockReply {
  id: string;
  body: string;
  author: string;
  createdAt: string;
  upvotes: number;
  isCoach: boolean;
  isFeatured: boolean;
  coach?: {
    name: string;
    title: string;
    accreditation: string;
    coachId: string; // replace with real coach ID before production
  };
}

export interface MockThread {
  id: string;
  slug: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  upvotes: number;
  replies: MockReply[];
}

export interface MockArticle {
  id: string;
  tag: string;
  title: string;
  bg: string;
  badge?: string;
  cta: string;
  href: string;
  external?: boolean;
}

export const INSIGHT_CHIPS = [
  {
    id: '1',
    bg: 'bg-purple-900',
    tag: 'Career Burnout',
    title: "3 signs you're in burnout (not just tired)",
    meta: '1 min read',
    metaIcon: '⏱️',
    slug: 'coaching-vs-therapy-difference',
  },
  {
    id: '2',
    bg: 'bg-emerald-900',
    tag: 'Pay Rise Strategy',
    title: 'How to ask for £10k more without the awkwardness',
    meta: '2 min read',
    metaIcon: '⏱️',
    slug: 'passed-over-for-promotion',
  },
  {
    id: '3',
    bg: 'bg-amber-800',
    tag: 'Founder Dynamics',
    title: 'Resolving co-founder equity disputes',
    meta: '60s Voice Note',
    metaIcon: '🎙️',
    slug: 'co-founder-equity-dispute',
  },
  {
    id: '4',
    bg: 'bg-teal-900',
    tag: 'Leadership',
    title: 'Command a room in 60 seconds',
    meta: '1 min read',
    metaIcon: '⏱️',
    slug: 'how-to-handle-micromanager',
  },
];

export const THREADS: MockThread[] = [];

const _REMOVED_THREADS: MockThread[] = [
  {
    id: '1',
    slug: 'passed-over-for-promotion',
    title: 'Passed over for promotion at 35. Stay and fight or look elsewhere?',
    body: "I've been at my company for 6 years and was passed over for a senior role — again. The person they promoted has 2 years less experience than me and I was told I 'need to work on executive presence'. I don't even know what that means. I'm seriously considering leaving but I have a mortgage and a young child. Has anyone been through this? Did you stay or go? Was it the right call?",
    author: 'AnonymousUser_84',
    createdAt: '2 days ago',
    upvotes: 47,
    replies: [
      {
        id: 'r1',
        body: "I stayed in a similar situation and regretted it for 18 months before I finally left. The culture was the problem, not me. Once I moved, I got promoted within a year. Sometimes the environment just doesn't see your value.",
        author: 'career_pivot_2024',
        createdAt: '1 day ago',
        upvotes: 23,
        isCoach: false,
        isFeatured: false,
      },
      {
        id: 'r2',
        body: `"Executive presence" is one of those vague phrases that often masks bias or a lack of clear criteria. Before deciding to leave, I'd recommend requesting a structured conversation with your manager about exactly what behaviours they want to see — documented, with a timeline. If they can't give you concrete answers, that tells you everything. If they can, you have a clear test. Either way, you'll make a better-informed decision. I work with professionals navigating exactly this crossroads — happy to share more about how executive coaching can help you clarify your next move.`,
        author: 'SarahJ_Coach',
        createdAt: '18 hours ago',
        upvotes: 61,
        isCoach: true,
        isFeatured: true,
        coach: {
          name: 'Sarah J.',
          title: 'Executive & Career Coach',
          accreditation: 'PCC · ICF Accredited',
          coachId: 'placeholder-coach-id-sarah',
        },
      },
      {
        id: 'r3',
        body: 'Six years is a long time to invest. I would make sure you have a frank conversation before making any decision — sometimes companies just need a nudge to realise what they\'re about to lose.',
        author: 'MidCareerMike',
        createdAt: '12 hours ago',
        upvotes: 8,
        isCoach: false,
        isFeatured: false,
      },
    ],
  },
  {
    id: '2',
    slug: 'coaching-vs-therapy-difference',
    title: "What's the actual difference between a life coach and a therapist? Genuinely confused.",
    body: "I've been struggling with anxiety and imposter syndrome at work. A friend suggested a coach, my GP suggested a therapist. Both cost money. What's the actual difference? Is one better for work stuff? I don't have a traumatic backstory — I just feel stuck and like I can't trust my own judgement anymore.",
    author: 'QuietlyStrugglingLondon',
    createdAt: '4 days ago',
    upvotes: 112,
    replies: [
      {
        id: 'r4',
        body: `Therapists are typically licensed mental health professionals who explore past experiences and diagnose conditions. Coaches focus on present-to-future — setting goals, building habits, and unlocking performance. Neither is universally "better". For imposter syndrome at work with no clinical history, coaching is often the more direct route. That said, a good coach will always refer you to therapy if they feel it's what you need. The two are complementary, not competing.`,
        author: 'AbzS_EIA_Coach',
        createdAt: '3 days ago',
        upvotes: 89,
        isCoach: true,
        isFeatured: true,
        coach: {
          name: 'Abz S.',
          title: 'Life & Performance Coach',
          accreditation: 'EIA · EMCC Accredited',
          coachId: 'placeholder-coach-id-abz',
        },
      },
      {
        id: 'r5',
        body: 'I had the same question. Went with a coach first, did 6 sessions, clarity improved massively. Therapy is brilliant but coaching is more action-oriented which sounds like what you need.',
        author: 'TechWorkerTrevor',
        createdAt: '2 days ago',
        upvotes: 34,
        isCoach: false,
        isFeatured: false,
      },
    ],
  },
  {
    id: '3',
    slug: 'co-founder-equity-dispute',
    title: 'Co-founder wants to renegotiate our equity split 18 months in. Where do I stand?',
    body: "We started 50/50 eighteen months ago. Now they're saying their contribution has been greater and want to move to 60/40 in their favour. I don't agree — I've handled everything client-facing while they've built the product. We don't have a shareholders' agreement. I'm not sure if this is a legal question or a coaching question but I feel completely blindsided.",
    author: 'StartupFounder_Anon',
    createdAt: '1 week ago',
    upvotes: 78,
    replies: [
      {
        id: 'r6',
        body: "First: get a shareholder's agreement drafted immediately regardless of what you decide about the equity. This should have been done at inception but it's not too late. Second: this is both a legal and a coaching question. The emotional side (feeling blindsided, loss of trust) needs as much attention as the legal mechanics. A mediator or coach who specialises in founder dynamics can help you have this conversation productively rather than adversarially.",
        author: 'VentureVoice',
        createdAt: '6 days ago',
        upvotes: 41,
        isCoach: false,
        isFeatured: false,
      },
      {
        id: 'r7',
        body: 'This is more common than founders admit publicly. The absence of a SHA means you have more negotiating room than you think — but also more risk. I work with founders at exactly this junction and the pattern I see most often is that the equity disagreement is a symptom of an underlying conversation about roles, recognition and value that has never been had directly. Happy to discuss further.',
        author: 'FounderCoach_Practitioner',
        createdAt: '5 days ago',
        upvotes: 55,
        isCoach: true,
        isFeatured: true,
        coach: {
          name: 'Marcus T.',
          title: 'Business & Founder Coach',
          accreditation: 'PCC · ICF Accredited',
          coachId: 'placeholder-coach-id-marcus',
        },
      },
    ],
  },
  {
    id: '4',
    slug: 'how-to-handle-micromanager',
    title: 'My manager checks in every hour and cc\'s themselves on all my emails. How do I handle this without quitting?',
    body: "I've been in this role 8 months and my manager monitors everything I do. I get a message if I haven't replied to Slack within 20 minutes. They want to review everything before it goes out. I'm 34 years old and have 10 years of experience. I feel like I'm going backwards. I don't want to quit because the salary is good and the work itself is interesting — it's just this one person.",
    author: 'ExperiencedButExasperated',
    createdAt: '3 days ago',
    upvotes: 93,
    replies: [
      {
        id: 'r8',
        body: "Micromanagement is almost always about the manager's anxiety rather than your competence. The most effective move I've seen is to proactively over-communicate before they ask — daily end-of-day summaries, a shared tracker, brief morning messages outlining your plan. You remove the anxiety triggers before they act on them. It's uncomfortable at first because it feels like you're doing extra work for their benefit, but it typically halves the check-ins within 2-3 weeks.",
        author: 'AbzS_EIA_Coach',
        createdAt: '2 days ago',
        upvotes: 77,
        isCoach: true,
        isFeatured: true,
        coach: {
          name: 'Abz S.',
          title: 'Life & Performance Coach',
          accreditation: 'EIA · EMCC Accredited',
          coachId: 'placeholder-coach-id-abz',
        },
      },
      {
        id: 'r9',
        body: "I had almost this exact situation. The proactive communication tip above genuinely works. I also found scheduling a weekly 1:1 to front-load their need for updates helped enormously — it contained the ad-hoc interruptions.",
        author: 'SeniorDevSurvivingCorporate',
        createdAt: '1 day ago',
        upvotes: 29,
        isCoach: false,
        isFeatured: false,
      },
    ],
  },
];

export const ARTICLES: MockArticle[] = [
  {
    id: 'a1',
    tag: 'Guide',
    title: 'Coaching vs Therapy: What do you actually need?',
    bg: 'bg-teal-50',
    badge: '🛡️ ICF / EMCC Verified',
    cta: 'Read →',
    href: '/insights-poc/coaching-vs-therapy-difference',
  },
  {
    id: 'a2',
    tag: 'Accreditation',
    title: 'What is coaching accreditation and why does it matter?',
    bg: 'bg-purple-50',
    badge: '🎓 CoachDog Verified',
    cta: 'Read →',
    href: '/how-to-find-a-certified-verified-coach',
  },
  {
    id: 'a3',
    tag: 'Practical Tip',
    title: 'How to handle a micromanager with grace',
    bg: 'bg-amber-50',
    badge: 'Authored with Abz S., EIA',
    cta: 'Read →',
    href: '/insights-poc/articles/coaching-vs-mentoring',
  },
  {
    id: 'a4',
    tag: 'Career',
    title: "What 'executive presence' actually means — and how to build it",
    bg: 'bg-emerald-50',
    badge: 'Authored by Sarah J., PCC',
    cta: 'Read →',
    href: '/insights-poc/articles/executive-presence-explained',
  },
];

// ── Coach Hub mock data ──────────────────────────────────────────────────────

export type CollabType = 'podcast_guest' | 'co_host' | 'referral_partner' | 'accountability' | 'content_collab' | 'other';

export const COLLAB_TYPE_LABELS: Record<CollabType, string> = {
  podcast_guest: 'Podcast Guest',
  co_host: 'Webinar Co-host',
  referral_partner: 'Referral Partner',
  accountability: 'Accountability Partner',
  content_collab: 'Content Collaboration',
  other: 'Other',
};

export const COLLAB_TYPE_COLORS: Record<CollabType, string> = {
  podcast_guest: 'bg-purple-100 text-purple-700',
  co_host: 'bg-blue-100 text-blue-700',
  referral_partner: 'bg-emerald-100 text-emerald-700',
  accountability: 'bg-amber-100 text-amber-700',
  content_collab: 'bg-teal-100 text-teal-700',
  other: 'bg-slate-100 text-slate-600',
};

export interface MockCollabPost {
  id: string;
  coachName: string;
  coachTitle: string;
  type: CollabType;
  title: string;
  description: string;
  createdAt: string;
  respondBy?: string | null;
}

export const MOCK_COLLAB_POSTS: MockCollabPost[] = [
  {
    id: 'c1',
    coachName: 'Sarah J.',
    coachTitle: 'Executive & Career Coach · PCC',
    type: 'podcast_guest',
    title: 'Looking for a guest for my podcast on career transitions',
    description: `I run a monthly podcast (800 listeners) focused on mid-career transitions — people pivoting industries, going from corporate to consulting, or returning after a career break. I'm looking for a coach who specialises in confidence or identity work to join me for a 30-minute conversation. Recorded remotely, edited and published within 2 weeks. Happy to return the favour on your platform.`,
    createdAt: '3 days ago',
    respondBy: '2026-10-10',
  },
  {
    id: 'c2',
    coachName: 'Marcus T.',
    coachTitle: 'Business & Founder Coach · PCC',
    type: 'referral_partner',
    title: `Seeking referral partner — I work with founders, looking for a life/wellbeing coach`,
    description: `I coach early-stage founders on strategy, fundraising and co-founder dynamics. I regularly have clients who need wellbeing or burnout support that's outside my scope. Looking for a trusted life or wellbeing coach I can refer to confidently — and vice versa if you work with founders. Informal arrangement to start.`,
    createdAt: '1 week ago',
    respondBy: null,
  },
  {
    id: 'c3',
    coachName: 'Abz S.',
    coachTitle: 'Life & Performance Coach · EIA',
    type: 'co_host',
    title: 'Co-hosting a free online workshop — imposter syndrome at work',
    description: `Planning a free 60-minute Zoom workshop on imposter syndrome for professionals. I'll cover the psychology side — looking for a co-host who can bring the career/leadership angle. Aiming for next month. We'd split promotion, run it together, and each capture leads. Already have a mailing list of ~400 to promote to.`,
    createdAt: '2 days ago',
    respondBy: '2026-10-15',
  },
  {
    id: 'c4',
    coachName: 'Priya K.',
    coachTitle: 'Leadership Coach · ACC',
    type: 'accountability',
    title: 'Accountability partner wanted — building my group coaching offer',
    description: `I'm developing my first group coaching programme (6-week cohort, leadership focus) and want an accountability partner to check in with weekly. Looking for another coach who is also building something new — we hold each other to deadlines, share blockers, celebrate wins. 30-minute call weekly for 8 weeks. DM me if interested.`,
    createdAt: '5 days ago',
    respondBy: '2026-10-28',
  },
  {
    id: 'c5',
    coachName: 'Rachel M.',
    coachTitle: 'Career & Strengths Coach · PCC',
    type: 'content_collab',
    title: 'Collaboration on a strengths-based coaching guide for early-career professionals',
    description: `Writing a practical guide (digital PDF) on using strengths assessment tools — CliftonStrengths, VIA, etc. — at the start of your career. Looking for a co-author with executive coaching experience to add a longer-term perspective. Revenue share 50/50. Aiming to launch on Gumroad. First draft ready.`,
    createdAt: '1 day ago',
    respondBy: null,
  },
];

export type ContentType = 'article' | 'video' | 'resource';

export interface MockCoachContent {
  id: string;
  coachName: string;
  coachTitle: string;
  contentType: ContentType;
  title: string;
  description: string;
  tag: string;
  url?: string;
  createdAt: string;
}

export const MOCK_COACH_CONTENT: MockCoachContent[] = [
  {
    id: 'cc1',
    coachName: 'Sarah J.',
    coachTitle: 'Executive & Career Coach · PCC',
    contentType: 'article',
    title: 'The 3-email rule: how I negotiated a £12k pay rise',
    description: 'A step-by-step breakdown of the email sequence I teach clients — from anchoring your number to handling a counter-offer without caving.',
    tag: 'Salary Negotiation',
    createdAt: '1 week ago',
  },
  {
    id: 'cc2',
    coachName: 'Marcus T.',
    coachTitle: 'Business & Founder Coach · PCC',
    contentType: 'video',
    title: 'Co-founder conversations: what to agree before you start',
    description: 'A 12-minute walkthrough of the 5 founder agreements I recommend before any startup gets off the ground — equity, roles, decision rights, exit, and culture.',
    tag: 'Founder Advice',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    createdAt: '3 days ago',
  },
  {
    id: 'cc3',
    coachName: 'Abz S.',
    coachTitle: 'Life & Performance Coach · EIA',
    contentType: 'resource',
    title: 'The Weekly Reset: a 15-minute Sunday planning template',
    description: 'A free Notion template I give all my clients. Review the past week, set 3 priorities, and close the mental loops that keep you up on Sunday nights.',
    tag: 'Productivity',
    url: 'https://notion.so',
    createdAt: '2 weeks ago',
  },
];

// ── Long articles ──────────────────────────────────────────────────────────────

export interface MockLongArticle {
  slug: string;
  title: string;
  tag: string;
  author: {
    name: string;
    title: string;
    accreditation: string;
    coachId: string;
  };
  publishedAt: string;
  readTime: string;
  body: string[];  // paragraphs
  relatedSlugs: string[];
}

export const LONG_ARTICLES: MockLongArticle[] = [
  {
    slug: 'executive-presence-explained',
    title: "What 'executive presence' actually means — and how to build it",
    tag: 'Career Development',
    author: {
      name: 'Sarah J.',
      title: 'Executive & Career Coach',
      accreditation: 'PCC · ICF Accredited',
      coachId: 'placeholder-coach-id-sarah',
    },
    publishedAt: '12 September 2026',
    readTime: '4 min read',
    body: [
      "If you have ever been told you need more 'executive presence', you probably walked away with no idea what to actually do differently. It is one of the most common pieces of feedback given to high-performing professionals — and one of the least useful, because it is rarely explained.",
      "Executive presence is not about being the loudest person in the room or having a commanding physique. At its core it is about three things: how you communicate under pressure, how you make others feel when you interact with them, and how consistently you show up with clarity and composure.",
      "The communication piece is usually where people struggle most. When challenged or put on the spot, many talented professionals over-explain, hedge, or seek validation. Those with strong executive presence do the opposite — they pause, speak in fewer words, and land their point with confidence before adding context. It is not about arrogance. It is about trusting your own judgement enough to state it directly.",
      "The second element — how you make others feel — is often overlooked. Leaders with presence tend to give their full attention in conversations. They ask follow-up questions. They remember details. These small habits compound into a reputation for being someone worth listening to.",
      "Composure under pressure is the third pillar and arguably the hardest to develop. It does not mean suppressing emotion. It means having enough self-awareness to choose how you respond rather than react. This is where coaching has its greatest impact — not in teaching presence as a performance, but in helping you understand the beliefs and patterns that currently get in your way.",
      "If you have been told you need more executive presence, the best starting question is not 'how do I seem more senior?' It is 'what am I afraid of in these moments, and what story am I telling myself?' The presence follows from there.",
    ],
    relatedSlugs: ['passed-over-for-promotion', 'how-to-handle-micromanager'],
  },
  {
    slug: 'coaching-vs-mentoring',
    title: 'Coaching vs Mentoring: the difference most people miss',
    tag: 'Understanding Coaching',
    author: {
      name: 'Abz S.',
      title: 'Life & Performance Coach',
      accreditation: 'EIA · EMCC Accredited',
      coachId: 'placeholder-coach-id-abz',
    },
    publishedAt: '8 September 2026',
    readTime: '3 min read',
    body: [
      "Most people use coaching and mentoring interchangeably. They are not the same thing, and understanding the difference will help you choose the right kind of support at the right time.",
      "A mentor is someone who has walked a path you want to walk. They share their experience, their contacts, and their hard-won lessons. The relationship is directional — knowledge flows from the person who has done it to the person who wants to. A great mentor can save you years of mistakes. They are invaluable when you need guidance from lived experience.",
      "A coach takes a different stance entirely. A good coach does not need to have done what you want to do. Their role is not to transfer their experience onto you — it is to help you access your own clarity. Coaching is built on the premise that you already hold the answers, and that the right questions will surface them.",
      "This distinction matters in practice. If you are starting a business in an industry where your mentor has run a company, their guidance on operations, hiring, and funding is gold. But if you are struggling with confidence, a difficult relationship at work, or a recurring pattern that keeps getting in your way — a mentor's advice ('just be more assertive', 'don't let it bother you') is unlikely to shift anything. You need someone who can help you understand why the pattern exists.",
      "In reality the best support often combines both. You might work with a mentor for sector-specific knowledge and a coach in parallel to address the internal blocks that are limiting how far you go. The two are not in competition — they address different layers of the same challenge.",
      "When choosing between them, ask yourself this: do I need someone to show me the way, or do I need someone to help me find my own? The answer usually makes the decision obvious.",
    ],
    relatedSlugs: ['coaching-vs-therapy-difference', 'co-founder-equity-dispute'],
  },
];
