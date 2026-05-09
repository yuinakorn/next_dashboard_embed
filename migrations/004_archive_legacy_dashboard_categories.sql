UPDATE portal_categories
SET status = 'archived'
WHERE id IN (
  'executive',
  'executive-kpi',
  'executive-region',
  'operations',
  'operations-bed',
  'operations-opd',
  'digital-health',
  'digital-health-sso',
  'digital-health-data'
);

DELETE FROM portal_category_scopes
WHERE category_id IN (
  'executive',
  'executive-kpi',
  'executive-region',
  'operations',
  'operations-bed',
  'operations-opd',
  'digital-health',
  'digital-health-sso',
  'digital-health-data'
);

INSERT IGNORE INTO portal_category_scopes (user_id, team_id, category_id) VALUES
  ('u-001', 'team-digital-health', 'health'),
  ('u-001', 'team-digital-health', 'health-resources'),
  ('u-001', 'team-digital-health', 'health-resources-digital');
