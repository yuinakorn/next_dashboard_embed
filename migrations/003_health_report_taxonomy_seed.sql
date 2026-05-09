CREATE TABLE IF NOT EXISTS portal_category_closure (
  ancestor_id VARCHAR(80) NOT NULL,
  descendant_id VARCHAR(80) NOT NULL,
  depth INT NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id),
  CONSTRAINT fk_portal_category_closure_ancestor
    FOREIGN KEY (ancestor_id) REFERENCES portal_categories(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_portal_category_closure_descendant
    FOREIGN KEY (descendant_id) REFERENCES portal_categories(id)
    ON DELETE CASCADE,
  INDEX idx_portal_category_closure_descendant (descendant_id),
  INDEX idx_portal_category_closure_depth (depth)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO portal_categories (id, name, parent_id, owner_team_id, sort_order, created_by) VALUES
  ('health', 'ข้อมูลด้านสาธารณสุข', NULL, 'team-public-data', 100, 'seed'),
  ('health-general', 'ข้อมูลทั่วไป', 'health', 'team-public-data', 110, 'seed'),
  ('health-general-population', 'ประชากร', 'health-general', 'team-public-data', 111, 'seed'),
  ('health-general-facilities', 'หน่วยบริการ', 'health-general', 'team-public-data', 112, 'seed'),
  ('health-general-workforce', 'บุคลากรสาธารณสุข', 'health-general', 'team-public-data', 113, 'seed'),
  ('health-status', 'สถานะสุขภาพ', 'health', 'team-public-data', 120, 'seed'),
  ('health-status-communicable', 'โรคติดต่อ', 'health-status', 'team-public-data', 121, 'seed'),
  ('health-status-ncd', 'โรคไม่ติดต่อเรื้อรัง', 'health-status', 'team-public-data', 122, 'seed'),
  ('health-status-ncd-diabetes', 'เบาหวาน', 'health-status-ncd', 'team-public-data', 123, 'seed'),
  ('health-status-ncd-hypertension', 'ความดันโลหิตสูง', 'health-status-ncd', 'team-public-data', 124, 'seed'),
  ('health-status-mch', 'แม่และเด็ก', 'health-status', 'team-public-data', 125, 'seed'),
  ('health-access', 'การเข้าถึงบริการ', 'health', 'team-public-data', 130, 'seed'),
  ('health-access-opd-ipd', 'ผู้ป่วยนอก/ผู้ป่วยใน', 'health-access', 'team-public-data', 131, 'seed'),
  ('health-access-emergency', 'อุบัติเหตุและฉุกเฉิน', 'health-access', 'team-public-data', 132, 'seed'),
  ('health-access-referral', 'การส่งต่อ', 'health-access', 'team-public-data', 133, 'seed'),
  ('health-prevention', 'ส่งเสริมป้องกัน', 'health', 'team-public-data', 140, 'seed'),
  ('health-prevention-vaccine', 'วัคซีน', 'health-prevention', 'team-public-data', 141, 'seed'),
  ('health-prevention-screening', 'การคัดกรอง', 'health-prevention', 'team-public-data', 142, 'seed'),
  ('health-resources', 'ทรัพยากรและระบบบริการ', 'health', 'team-public-data', 150, 'seed'),
  ('health-resources-beds', 'เตียงและทรัพยากร', 'health-resources', 'team-public-data', 151, 'seed'),
  ('health-resources-digital', 'ระบบดิจิทัลสุขภาพ', 'health-resources', 'team-digital-health', 152, 'seed');

INSERT IGNORE INTO portal_category_closure (ancestor_id, descendant_id, depth)
SELECT id, id, 0
FROM portal_categories;

INSERT IGNORE INTO portal_category_closure (ancestor_id, descendant_id, depth)
WITH RECURSIVE category_paths AS (
  SELECT
    parent_id AS ancestor_id,
    id AS descendant_id,
    1 AS depth
  FROM portal_categories
  WHERE parent_id IS NOT NULL
  UNION ALL
  SELECT
    c.parent_id AS ancestor_id,
    cp.descendant_id,
    cp.depth + 1 AS depth
  FROM category_paths cp
  JOIN portal_categories c
    ON c.id = cp.ancestor_id
  WHERE c.parent_id IS NOT NULL
)
SELECT ancestor_id, descendant_id, depth
FROM category_paths
WHERE ancestor_id IS NOT NULL;

INSERT IGNORE INTO portal_dashboards (
  id, title, description, provider, category_id, owner_team_id, owner_user_id, owner_name,
  status, sensitivity, embed_url, external_url, embed_status, embed_status_reason,
  refresh_frequency, data_source_note, views, is_pinned, published_at, last_reviewed_at, created_by
) VALUES
  (
    'db-health-001',
    'ภาพรวมประชากรจังหวัดเชียงใหม่',
    'รายงานจำนวนประชากร โครงสร้างอายุ และการกระจายตามอำเภอสำหรับใช้ประกอบการวางแผนบริการสุขภาพ',
    'Looker Studio',
    'health-general-population',
    'team-public-data',
    'seed',
    'กลุ่มงานข้อมูลสุขภาพ',
    'published',
    'public',
    'https://lookerstudio.google.com/embed/reporting/demo',
    'https://lookerstudio.google.com/',
    'embeddable',
    'Looker Studio embed reporting URLs are designed for iframe usage.',
    'monthly',
    'ข้อมูล mock สำหรับแสดงโครงสร้าง portal รายงานสุขภาพ',
    3420,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'seed'
  ),
  (
    'db-health-002',
    'ความครอบคลุมการคัดกรองเบาหวาน',
    'ติดตามผลการคัดกรองเบาหวานในกลุ่มเป้าหมาย แยกตามอำเภอ หน่วยบริการ และช่วงเวลา',
    'Looker Studio',
    'health-status-ncd-diabetes',
    'team-public-data',
    'seed',
    'งานควบคุมโรคไม่ติดต่อ',
    'published',
    'public',
    'https://lookerstudio.google.com/embed/reporting/demo',
    'https://lookerstudio.google.com/',
    'embeddable',
    'Looker Studio embed reporting URLs are designed for iframe usage.',
    'monthly',
    'ตัวอย่างรายงาน public ที่อยู่ลึก 4 ระดับใน taxonomy',
    2864,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'seed'
  ),
  (
    'db-health-003',
    'ทะเบียนติดตามผู้ป่วยเบาหวานรายพื้นที่',
    'รายงานติดตาม cohort ผู้ป่วยเบาหวานสำหรับเจ้าหน้าที่ ใช้ตรวจสอบผลบริการและความต่อเนื่องของการดูแล',
    'Superset',
    'health-status-ncd-diabetes',
    'team-public-data',
    'seed',
    'งานควบคุมโรคไม่ติดต่อ',
    'published',
    'internal',
    'https://superset.apache.org/',
    'https://superset.apache.org/',
    'external_only',
    'This seed uses an external URL to demonstrate login-required reports with fallback links.',
    'weekly',
    'ต้อง login ก่อนเข้าถึง เพราะเป็นรายงานสำหรับเจ้าหน้าที่',
    918,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'seed'
  ),
  (
    'db-health-004',
    'ความครอบคลุมวัคซีนเด็กปฐมวัย',
    'รายงานความครอบคลุมการได้รับวัคซีนตามเกณฑ์ แยกตามพื้นที่และช่วงอายุ',
    'Looker Studio',
    'health-prevention-vaccine',
    'team-public-data',
    'seed',
    'กลุ่มงานส่งเสริมสุขภาพ',
    'published',
    'public',
    'https://lookerstudio.google.com/embed/reporting/demo',
    'https://lookerstudio.google.com/',
    'embeddable',
    'Looker Studio embed reporting URLs are designed for iframe usage.',
    'monthly',
    'ข้อมูล mock สำหรับหมวดส่งเสริมป้องกัน',
    1986,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'seed'
  ),
  (
    'db-health-005',
    'ปริมาณผู้ป่วยนอกและผู้ป่วยใน',
    'แนวโน้มการรับบริการ OPD/IPD รายเดือน แยกตามหน่วยบริการและกลุ่มโรคสำคัญ',
    'Power BI',
    'health-access-opd-ipd',
    'team-public-data',
    'seed',
    'กลุ่มงานบริการสุขภาพ',
    'published',
    'internal',
    'https://app.powerbi.com/',
    'https://powerbi.microsoft.com/',
    'external_only',
    'Power BI reports may require organization login or embed configuration.',
    'weekly',
    'ต้อง login ก่อนเข้าถึงรายงานบริการภายใน',
    1472,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'seed'
  ),
  (
    'db-health-006',
    'สถานะเตียงและทรัพยากรบริการ',
    'ภาพรวมทรัพยากรบริการ เตียง และความพร้อมในการรองรับผู้ป่วย แสดงระดับจังหวัดและรายอำเภอ',
    'Grafana',
    'health-resources-beds',
    'team-ops',
    'seed',
    'ศูนย์ปฏิบัติการบริการสุขภาพ',
    'published',
    'restricted',
    'https://grafana.com/',
    'https://grafana.com/',
    'external_only',
    'This is a restricted operations report and should be opened after authorization.',
    'daily',
    'รายงาน restricted สำหรับเจ้าหน้าที่ที่มีสิทธิ์',
    792,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'seed'
  );

INSERT IGNORE INTO portal_tags (name) VALUES
  ('ประชากร'),
  ('NCD'),
  ('เบาหวาน'),
  ('วัคซีน'),
  ('OPD/IPD'),
  ('ทรัพยากรบริการ');

INSERT IGNORE INTO portal_dashboard_tags (dashboard_id, tag_id)
SELECT 'db-health-001', id FROM portal_tags WHERE name IN ('ประชากร');

INSERT IGNORE INTO portal_dashboard_tags (dashboard_id, tag_id)
SELECT 'db-health-002', id FROM portal_tags WHERE name IN ('NCD', 'เบาหวาน');

INSERT IGNORE INTO portal_dashboard_tags (dashboard_id, tag_id)
SELECT 'db-health-003', id FROM portal_tags WHERE name IN ('NCD', 'เบาหวาน');

INSERT IGNORE INTO portal_dashboard_tags (dashboard_id, tag_id)
SELECT 'db-health-004', id FROM portal_tags WHERE name IN ('วัคซีน');

INSERT IGNORE INTO portal_dashboard_tags (dashboard_id, tag_id)
SELECT 'db-health-005', id FROM portal_tags WHERE name IN ('OPD/IPD');

INSERT IGNORE INTO portal_dashboard_tags (dashboard_id, tag_id)
SELECT 'db-health-006', id FROM portal_tags WHERE name IN ('ทรัพยากรบริการ');

UPDATE portal_dashboards
SET
  embed_url = '/mock-embed/population',
  external_url = '/mock-embed/population',
  embed_status = 'embeddable',
  embed_status_reason = 'Local mock embed route for portal demonstration.'
WHERE id = 'db-health-001';

UPDATE portal_dashboards
SET
  embed_url = '/mock-embed/diabetes',
  external_url = '/mock-embed/diabetes',
  embed_status = 'embeddable',
  embed_status_reason = 'Local mock embed route for portal demonstration.'
WHERE id = 'db-health-002';

UPDATE portal_dashboards
SET
  embed_url = '/mock-embed/vaccine',
  external_url = '/mock-embed/vaccine',
  embed_status = 'embeddable',
  embed_status_reason = 'Local mock embed route for portal demonstration.'
WHERE id = 'db-health-004';
