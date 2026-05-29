-- Seed: Abz Salloum's product review (sourced from LinkedIn post, inserted by admin)
-- Reviewer: Abz Salloum | coach.abz01@gmail.com | UUID: 9ef6f4fc-953b-4f51-8a4f-a0ab9c7c2129

INSERT INTO public.product_reviews (
  reviewer_id,
  reviewer_name,
  reviewer_title,
  rating,
  review_text,
  source,
  is_approved,
  created_at
) VALUES (
  '9ef6f4fc-953b-4f51-8a4f-a0ab9c7c2129',
  'Abz Salloum',
  'EMCC EIA Accredited Senior Practitioner',
  5,
  'I''m proud to be part of Coachdog. Having experienced many SaaS platforms, I can confidently say that Coachdog stands out as a truly brilliant space. It not only showcases your credentials effectively but also creates meaningful opportunities for clients to connect with coaches who are the right fit for them. I highly recommend Coachdog. If you''d like to learn more, feel free to reach out to Jamie or Paul.',
  'site',
  true,
  NOW()
);
