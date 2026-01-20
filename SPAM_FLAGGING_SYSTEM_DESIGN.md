# Enhanced Spam Flagging System Design

## 🎯 Vision
A multi-tiered spam detection and flagging system inspired by Facebook/Instagram, with automated detection, category-based pathways, and intelligent moderation.

---

## 📋 Current State

### ✅ What Exists Now
1. **Spam Detection Fields** (migration: `20260116_spam_detection_and_comments.sql`):
   - `spam_score` (0-100 confidence)
   - `spam_reasons` (array of reasons)
   - `is_spam` (boolean flag)
   - `spam_category` (text: abusive, promotional, nonsense, repetitive, suspicious)

2. **Coach Comment System**:
   - Coaches can respond to reviews publicly
   - Comments stored in `review_comments` table

3. **Basic AI Spam Detection**:
   - Auto-detects spam during submission
   - Uses pattern matching and heuristics
   - Located in `utils/spamDetection.ts`

### ⚠️ Current Limitations
- No user-facing flag/report system
- No category selection for reporters
- No automated workflows based on category
- Spam columns exist but RLS policies don't filter them yet

---

## 🏗️ Proposed Enhanced System

### Phase 1: User Flag/Report Interface

#### A. Flag Button on Reviews
**Location**: Each review card on coach profile

**Categories** (inspired by Facebook/Instagram):
1. **Spam or Scam** 🚨
   - Pathway: **Automated check** → Auto-hide if spam_score > 70%
   - Fake profiles, bot reviews, promotional content

2. **False or Misleading** ⚠️
   - Pathway: **Manual screening**
   - Requires human review by support team
   - Factually incorrect information, impersonation

3. **Harassment or Hate Speech** 🛑
   - Pathway: **Immediate auto-removal** + manual review
   - Zero tolerance policy
   - Bullying, threats, discriminatory language

4. **Not Relevant** 📋
   - Pathway: **Automated check**
   - Review about wrong coach, off-topic content

5. **Personal Information Shared** 🔒
   - Pathway: **Immediate auto-removal** + manual review
   - Phone numbers, emails, addresses
   - Privacy violation

6. **Other** ❓
   - Pathway: **Manual screening**
   - Catch-all for unique cases

#### B. Flag Modal UI

```typescript
interface FlagReviewModal {
  reviewId: string;
  coachId: string;
  categories: {
    id: string;
    label: string;
    description: string;
    icon: string;
    pathway: 'auto-check' | 'auto-remove' | 'manual';
  }[];
  additionalContext?: string; // Optional text input
}
```

**UX Flow**:
1. User clicks "Flag Review" button
2. Modal opens with category selection
3. User selects category + optional explanation
4. System processes based on pathway
5. User sees confirmation: "Thank you for helping keep CoachDog safe"

---

### Phase 2: Automated Detection Pathways

#### Pathway 1: Automated Check (Spam/Scam, Not Relevant)

```typescript
// Pseudo-code workflow
async function handleAutomatedCheck(reviewId: string, flagCategory: string, flagReason: string) {
  // 1. Re-run spam detection with enhanced context
  const spamResult = await enhancedSpamDetection(reviewId, flagCategory, flagReason);

  // 2. Decision matrix
  if (spamResult.confidence >= 70) {
    // AUTO-HIDE: Hide from public view
    await hideReview(reviewId, 'auto-flagged');
    await notifyCoach(reviewId, 'Review hidden due to spam detection');
    await logModerationAction(reviewId, 'auto-hide', spamResult);
  } else if (spamResult.confidence >= 40) {
    // QUEUE FOR MANUAL REVIEW: Flag for human review
    await queueForManualReview(reviewId, flagCategory, spamResult);
    await notifyModerationTeam(reviewId);
  } else {
    // NO ACTION: Likely legitimate review
    await logFlag(reviewId, flagCategory, 'no-action');
  }
}
```

#### Pathway 2: Immediate Auto-Removal (Harassment, Personal Info)

```typescript
async function handleImmediateRemoval(reviewId: string, flagCategory: string) {
  // 1. Immediately hide review
  await hideReview(reviewId, 'immediate-removal');

  // 2. Queue for manual verification (in case of false positive)
  await queueForUrgentManualReview(reviewId, flagCategory);

  // 3. Notify relevant parties
  await notifyCoach(reviewId, 'Review removed due to policy violation');
  await notifyModerationTeam(reviewId, 'urgent');

  // 4. If verified as violation, consider reviewer penalty
  // (e.g., IP ban, rate limiting)
}
```

#### Pathway 3: Manual Screening (False/Misleading, Other)

```typescript
async function handleManualScreening(reviewId: string, flagCategory: string, flagReason: string) {
  // 1. Queue for human review (lower priority)
  await queueForManualReview(reviewId, flagCategory, {
    reason: flagReason,
    priority: 'normal'
  });

  // 2. Notify moderation team
  await notifyModerationTeam(reviewId, 'normal');

  // 3. Log for analytics
  await logFlag(reviewId, flagCategory, 'queued-manual');
}
```

---

### Phase 3: Moderation Dashboard

#### A. Admin Interface
**Location**: New route `/admin/moderation` (restricted to admin users)

**Features**:
1. **Queue View**:
   - Tabs: Urgent / Normal / Auto-Flagged / All
   - Sort by: Date, Category, Spam Score

2. **Review Card**:
   - Full review text
   - Reviewer info (name, location, date)
   - Coach info
   - Spam detection details
   - Flag reports (who flagged, category, reason)
   - AI recommendation

3. **Actions**:
   - ✅ **Approve**: Keep review visible
   - 🚫 **Remove**: Permanently delete
   - ⏸️ **Hide**: Temporarily hide (can unhide later)
   - 📝 **Edit**: Allow coach to respond officially
   - 🚨 **Ban Reviewer**: Prevent future reviews from this IP/email

4. **Audit Log**:
   - Track all moderation decisions
   - Who, what, when, why

#### B. Database Schema for Moderation

```sql
-- Moderation queue table
CREATE TABLE review_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  flag_category TEXT NOT NULL,
  flag_reason TEXT,
  reporter_ip TEXT, -- For tracking abuse
  reporter_fingerprint TEXT, -- Browser fingerprint
  pathway TEXT NOT NULL, -- 'auto-check', 'auto-remove', 'manual'
  priority TEXT NOT NULL, -- 'urgent', 'normal', 'low'
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved'
  assigned_to UUID, -- Moderator ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution TEXT, -- 'approved', 'removed', 'hidden', 'edited'
  moderator_notes TEXT
);

-- Moderation actions log
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  moderator_id UUID,
  action TEXT NOT NULL, -- 'approve', 'remove', 'hide', 'unhide', 'edit', 'ban'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banned reviewers (IP/fingerprint based)
CREATE TABLE banned_reviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  fingerprint TEXT,
  reason TEXT NOT NULL,
  banned_by UUID, -- Moderator ID
  banned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = permanent ban
  CONSTRAINT unique_ban UNIQUE (ip_address, fingerprint)
);
```

---

### Phase 4: Enhanced AI Detection

#### Improvements to `utils/spamDetection.ts`

1. **Context-Aware Detection**:
   - Analyze review against coach's profile (relevant coaching areas?)
   - Check reviewer history (first review? serial complainer?)
   - Compare to other reviews for same coach (outlier detection)

2. **Category-Specific Rules**:
   ```typescript
   const categoryDetectors = {
     'spam-scam': detectPromotionalContent,
     'harassment': detectAbusiveLanguage,
     'personal-info': detectPII,
     'not-relevant': detectRelevance,
     'false-misleading': detectFactualClaims
   };
   ```

3. **Machine Learning** (Future):
   - Train model on labeled spam/not-spam reviews
   - Improve accuracy over time
   - Use embeddings for semantic similarity

---

## 🎨 User Experience Flow

### For Reviewer (Flagging)
1. See inappropriate review
2. Click "⚠️ Flag Review" button
3. Modal opens with 6 categories
4. Select category → Optional: Add explanation
5. Click "Submit Report"
6. See confirmation: "Thank you. We'll review this."

### For Coach (Being Reviewed)
1. See review on their profile
2. Options:
   - Comment publicly (respond to review)
   - Flag review (if violates policies)
   - Contact support (for serious issues)

### For Admin (Moderating)
1. Navigate to `/admin/moderation`
2. See queue of flagged reviews (sorted by priority)
3. Click review card to expand
4. Review all context (review text, flags, AI score, history)
5. Make decision: Approve / Remove / Hide / Edit
6. Add moderator notes
7. Click "Resolve" → Review removed from queue

---

## 🔐 Security & Abuse Prevention

### 1. Rate Limiting
- Max 5 flags per user per day
- Max 10 flags per IP per day
- Exponential backoff for repeat flaggers

### 2. False Flag Detection
- Track users who repeatedly flag legitimate reviews
- If >70% of flags are rejected, warn user
- Repeated abuse = loss of flagging privilege

### 3. Privacy Protection
- Don't reveal who flagged a review
- Anonymous reporting
- No retaliation possible

### 4. Ban Evasion Prevention
- Fingerprint-based tracking (IP + browser fingerprint)
- CAPTCHA after multiple failed submissions
- Honeypot fields to catch bots

---

## 📊 Analytics & Metrics

### Track:
1. **Flag Metrics**:
   - Flags per category
   - False positive rate
   - Time to resolution

2. **Spam Detection Accuracy**:
   - True positives / False positives
   - Confidence score distribution
   - Category accuracy

3. **Moderation Workload**:
   - Queue size over time
   - Average resolution time
   - Moderator efficiency

### Dashboard Widgets:
- Flags per day (line chart)
- Category breakdown (pie chart)
- Resolution outcomes (bar chart)
- Queue health (gauge: green/yellow/red)

---

## 🚀 Implementation Phases

### Phase 1: Basic Flag System (Week 1-2)
- [ ] Add flag button to review cards
- [ ] Create flag modal UI with categories
- [ ] Create `review_moderation_queue` table
- [ ] Implement basic flagging endpoint
- [ ] Show "Thank you" confirmation

### Phase 2: Automated Pathways (Week 3-4)
- [ ] Implement auto-check pathway
- [ ] Implement auto-remove pathway
- [ ] Implement manual screening pathway
- [ ] Add spam detection enhancements
- [ ] Create notification system

### Phase 3: Moderation Dashboard (Week 5-6)
- [ ] Build admin `/admin/moderation` route
- [ ] Create queue view with tabs
- [ ] Implement review card with actions
- [ ] Add moderation action handlers
- [ ] Create audit log

### Phase 4: Advanced Features (Week 7+)
- [ ] Ban system for repeat offenders
- [ ] Rate limiting & abuse prevention
- [ ] Analytics dashboard
- [ ] ML-powered detection (future)
- [ ] Bulk moderation tools

---

## 💡 Additional Features to Consider

1. **Appeal System**: Allow reviewers to appeal removals
2. **Coach Tools**: Let coaches "dispute" reviews with evidence
3. **Community Moderation**: Trusted users can help flag (like Reddit moderators)
4. **Transparency Report**: Public stats on moderation actions
5. **Verified Reviews**: Badge for reviews from confirmed clients
6. **Review Quality Score**: Help users identify helpful vs unhelpful reviews

---

## 🎯 Success Metrics

1. **< 5% Spam Rate**: Keep spam reviews below 5% of total
2. **< 24hr Resolution**: Resolve flags within 24 hours
3. **> 90% Accuracy**: AI detection accuracy above 90%
4. **< 1% False Positives**: Minimize legitimate reviews flagged
5. **User Trust**: Survey coaches/clients on trust in review system

---

## 📝 Notes for Development

- Start simple: Get basic flagging working first
- Iterate based on real data: See what categories get used most
- Be conservative with auto-removal: Only for clear violations
- Provide transparency: Let users know their flag was reviewed
- Document everything: Create clear moderation guidelines
- Test with real examples: Use actual spam to tune detection

---

## 🔗 Related Files

- Current spam detection: `utils/spamDetection.ts`
- Spam DB migration: `supabase/migrations/20260116_spam_detection_and_comments.sql`
- Review display: `pages/CoachDetails.tsx`
- Supabase service: `services/supabaseService.ts`

This design provides a foundation for discussion. We can adjust priorities, features, and implementation details based on your feedback!
