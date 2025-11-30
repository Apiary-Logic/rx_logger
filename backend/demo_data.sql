INSERT INTO roles (role_name) VALUES
  ('full_user'),
  ('append_only'),
  ('read_only')
ON CONFLICT DO NOTHING;
-- USERS
INSERT INTO users (user_name, password_hash, display_name, email, mode)
VALUES
  -- Kermit: anxious, overworked, responsible
  ('kermit', 'x', 'Kermit the Frog', 'kermit@themuppetshow.com', 'personal'),
-- Miss Piggy: dramatic, sometimes forgetful
  ('miss_piggy', 'x', 'Miss Piggy', 'misspiggy@misspiggy.com', 'personal')
ON CONFLICT (user_name) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.role_name = 'full_user'
WHERE u.user_name IN ('kermit','miss_piggy')
ON CONFLICT DO NOTHING;

-- MEDICATIONS
-- Kermit: sertraline + lisinopril
INSERT INTO medications (user_id, name, dosage_amount, dosage_unit, route, notes)
VALUES
(
  (SELECT id FROM users WHERE user_name = 'kermit'),
  'Sertraline', 50, 'mg', 'oral',
  'Daily SSRI for general anxiety and responsibility overload.'
),
(
  (SELECT id FROM users WHERE user_name = 'kermit'),
  'Lisinopril', 10, 'mg', 'oral',
  'Blood pressure medication; morning dose.'
);

-- Miss Piggy: fluoxetine
INSERT INTO medications (user_id, name, dosage_amount, dosage_unit, route, notes)
VALUES
(
  (SELECT id FROM users WHERE user_name = 'miss_piggy'),
  'Fluoxetine', 20, 'mg', 'oral',
  'Take in the morning to avoid insomnia.');

-- Kermit schedule
INSERT INTO schedules (medication_id, schedule_type, frequency, frequency_unit, start_date, end_date, specific_times)
VALUES
(
  (SELECT id FROM medications WHERE name = 'Sertraline'
      AND user_id = (SELECT id FROM users WHERE user_name = 'kermit')),
  'fixed', 1, 'days', NOW(), NULL,
  ARRAY['09:00'::time]
),
(
  (SELECT id FROM medications WHERE name = 'Lisinopril'
      AND user_id = (SELECT id FROM users WHERE user_name = 'kermit')),
  'fixed', 1, 'days', NOW(), NULL,
  ARRAY['08:00'::time]
);

-- Miss Piggy schedule
INSERT INTO schedules (medication_id, schedule_type, frequency, frequency_unit, start_date, end_date, specific_times)
VALUES
(
  (SELECT id FROM medications WHERE name = 'Fluoxetine'
      AND user_id = (SELECT id FROM users WHERE user_name = 'miss_piggy')),
  'fixed', 1, 'days', NOW(), NULL,
  ARRAY['10:00'::time]
);


-- Kermit: adherent and responsible
INSERT INTO medication_events (
  user_id, medication_id, scheduled_time, actual_time,
  event_type, event_source, exception_code, notes
)
VALUES
  (
    (SELECT id FROM users WHERE user_name = 'kermit'),
    (SELECT id FROM medications WHERE name = 'Sertraline'
        AND user_id = (SELECT id FROM users WHERE user_name = 'kermit')),
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    'taken', 'manual', 'none', 'Morning routine successful.'
  ),
  (
    (SELECT id FROM users WHERE user_name = 'kermit'),
    (SELECT id FROM medications WHERE name = 'Lisinopril'
        AND user_id = (SELECT id FROM users WHERE user_name = 'kermit')),
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    'taken', 'manual', 'none', 'Right before coffee.'
  );

-- Miss Piggy: sometimes late, sometimes missed
INSERT INTO medication_events (
  user_id, medication_id, scheduled_time, actual_time,
  event_type, event_source, exception_code, notes
)
VALUES
  (
    (SELECT id FROM users WHERE user_name = 'miss_piggy'),
    (SELECT id FROM medications WHERE name = 'Fluoxetine'
        AND user_id = (SELECT id FROM users WHERE user_name = 'miss_piggy')),
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    'taken', 'manual', 'none', 'Felt fabulous after taking it.'
  ),
  (
    (SELECT id FROM users WHERE user_name = 'miss_piggy'),
    (SELECT id FROM medications WHERE name = 'Fluoxetine'
        AND user_id = (SELECT id FROM users WHERE user_name = 'miss_piggy')),
    NOW() - INTERVAL '1 day',
    NULL,
    'missed', 'manual', 'none', 'Completely forgot amidst the drama.'
  );

