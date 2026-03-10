-- Mark dummy/test coaches as not accepting new clients
-- Identifies dummies ONLY by email domain @coachdog.test — safe, cannot match real coaches

UPDATE coaches
SET
  availability_status        = 'not_accepting',
  availability_note          = 'Dummy account for test purposes only',
  show_availability_publicly = true
WHERE email LIKE '%@coachdog.test';

-- Rollback:
-- UPDATE coaches
-- SET availability_status = 'accepting', availability_note = '', show_availability_publicly = false
-- WHERE email LIKE '%@coachdog.test';
