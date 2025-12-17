-- CoachDog Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- COACHES TABLE
-- ============================================================================
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  photo_url TEXT,
  bio TEXT,
  location TEXT,
  hourly_rate INTEGER DEFAULT 0,
  years_experience INTEGER DEFAULT 0,

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  documents_submitted BOOLEAN DEFAULT FALSE,
  verification_body TEXT, -- e.g., "EMCC", "ICF"
  verification_number TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Subscription & Billing
  subscription_status TEXT DEFAULT 'onboarding' CHECK (subscription_status IN ('onboarding', 'trial', 'active', 'expired')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,

  -- Security
  two_factor_enabled BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- SPECIALTIES TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default specialties
INSERT INTO specialties (name) VALUES
  ('Career Growth'),
  ('Stress Relief'),
  ('Relationships'),
  ('Health & Wellness'),
  ('Executive Coaching'),
  ('General');

CREATE TABLE coach_specialties (
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES specialties(id) ON DELETE CASCADE,
  PRIMARY KEY (coach_id, specialty_id)
);

-- ============================================================================
-- FORMATS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE formats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO formats (name) VALUES
  ('In-Person'),
  ('Online'),
  ('Hybrid');

CREATE TABLE coach_formats (
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  format_id UUID REFERENCES formats(id) ON DELETE CASCADE,
  PRIMARY KEY (coach_id, format_id)
);

-- ============================================================================
-- CERTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuing_organization TEXT,
  issue_date DATE,
  expiry_date DATE,
  credential_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SOCIAL LINKS TABLE
-- ============================================================================
CREATE TABLE social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'LinkedIn', 'Website', 'Instagram', 'Twitter', 'Facebook'
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_url CHECK (url ~* '^https?://.+')
);

-- ============================================================================
-- LINK ANALYTICS TABLE (for tracking clicks on social links)
-- ============================================================================
CREATE TABLE link_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  social_link_id UUID REFERENCES social_links(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT,
  ip_address INET
);

-- ============================================================================
-- PROFILE VIEWS TABLE (for tracking profile page views)
-- ============================================================================
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  session_id TEXT
);

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  is_verified_client BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- QUESTIONNAIRE RESPONSES TABLE
-- ============================================================================
CREATE TABLE questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  goal TEXT, -- Specialty they're looking for
  sessions_per_month TEXT CHECK (sessions_per_month IN ('one', 'two', 'unlimited')),
  budget_range INTEGER,
  preferred_formats JSONB, -- Array of format preferences
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COACH MATCHES TABLE (stores questionnaire match results)
-- ============================================================================
CREATE TABLE coach_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_response_id UUID REFERENCES questionnaire_responses(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  match_score INTEGER, -- 0-100
  match_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX idx_coaches_email ON coaches(email);
CREATE INDEX idx_coaches_is_verified ON coaches(is_verified);
CREATE INDEX idx_coaches_subscription_status ON coaches(subscription_status);
CREATE INDEX idx_reviews_coach_id ON reviews(coach_id);
CREATE INDEX idx_social_links_coach_id ON social_links(coach_id);
CREATE INDEX idx_link_clicks_social_link_id ON link_clicks(social_link_id);
CREATE INDEX idx_link_clicks_coach_id ON link_clicks(coach_id);
CREATE INDEX idx_link_clicks_clicked_at ON link_clicks(clicked_at);
CREATE INDEX idx_profile_views_coach_id ON profile_views(coach_id);
CREATE INDEX idx_profile_views_viewed_at ON profile_views(viewed_at);
CREATE INDEX idx_certifications_coach_id ON certifications(coach_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_matches ENABLE ROW LEVEL SECURITY;

-- COACHES: Anyone can read verified coaches, only owner can update
CREATE POLICY "Anyone can view verified coaches"
  ON coaches FOR SELECT
  USING (is_verified = true OR auth.uid() = user_id);

CREATE POLICY "Coaches can update own profile"
  ON coaches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can register as coach"
  ON coaches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- COACH SPECIALTIES: Public read, coach can manage own
CREATE POLICY "Anyone can view coach specialties"
  ON coach_specialties FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage own specialties"
  ON coach_specialties FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM coaches WHERE id = coach_id));

-- COACH FORMATS: Public read, coach can manage own
CREATE POLICY "Anyone can view coach formats"
  ON coach_formats FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage own formats"
  ON coach_formats FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM coaches WHERE id = coach_id));

-- CERTIFICATIONS: Public read, coach can manage own
CREATE POLICY "Anyone can view certifications"
  ON certifications FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage own certifications"
  ON certifications FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM coaches WHERE id = coach_id));

-- SOCIAL LINKS: Public read, coach can manage own
CREATE POLICY "Anyone can view social links"
  ON social_links FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage own social links"
  ON social_links FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM coaches WHERE id = coach_id));

-- LINK CLICKS: Track anonymously, coach can view own
CREATE POLICY "Anyone can track link clicks"
  ON link_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Coaches can view own link clicks"
  ON link_clicks FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM coaches WHERE id = coach_id));

-- PROFILE VIEWS: Track anonymously, coach can view own
CREATE POLICY "Anyone can track profile views"
  ON profile_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Coaches can view own profile views"
  ON profile_views FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM coaches WHERE id = coach_id));

-- REVIEWS: Public read, verified clients can write
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Clients can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);

-- CLIENTS: Users can manage own profile
CREATE POLICY "Clients can view own profile"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clients can update own profile"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can register as client"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- QUESTIONNAIRE RESPONSES: Clients can manage own
CREATE POLICY "Clients can view own responses"
  ON questionnaire_responses FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM clients WHERE id = client_id));

CREATE POLICY "Clients can create responses"
  ON questionnaire_responses FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM clients WHERE id = client_id));

-- COACH MATCHES: Clients can view own matches
CREATE POLICY "Clients can view own matches"
  ON coach_matches FOR SELECT
  USING (auth.uid() IN (
    SELECT c.user_id FROM clients c
    JOIN questionnaire_responses qr ON qr.client_id = c.id
    WHERE qr.id = questionnaire_response_id
  ));

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- View for coach profiles with aggregated data
CREATE OR REPLACE VIEW coach_profiles AS
SELECT
  c.*,
  COALESCE(AVG(r.rating), 0) as avg_rating,
  COUNT(DISTINCT r.id) as review_count,
  COUNT(DISTINCT pv.id) as total_profile_views,
  ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as specialties,
  ARRAY_AGG(DISTINCT f.name) FILTER (WHERE f.name IS NOT NULL) as formats,
  ARRAY_AGG(DISTINCT cert.name) FILTER (WHERE cert.name IS NOT NULL) as certifications
FROM coaches c
LEFT JOIN reviews r ON c.id = r.coach_id
LEFT JOIN profile_views pv ON c.id = pv.coach_id
LEFT JOIN coach_specialties cs ON c.id = cs.coach_id
LEFT JOIN specialties s ON cs.specialty_id = s.id
LEFT JOIN coach_formats cf ON c.id = cf.coach_id
LEFT JOIN formats f ON cf.format_id = f.id
LEFT JOIN certifications cert ON c.id = cert.coach_id
GROUP BY c.id;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- You can insert your existing mock data here for testing
