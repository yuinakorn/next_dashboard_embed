CREATE TABLE IF NOT EXISTS portal_teams (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_categories (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id VARCHAR(80) NULL,
  owner_team_id VARCHAR(80) NOT NULL,
  status ENUM('active', 'inactive', 'archived') NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_by VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_portal_categories_parent
    FOREIGN KEY (parent_id) REFERENCES portal_categories(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_portal_categories_owner_team
    FOREIGN KEY (owner_team_id) REFERENCES portal_teams(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_dashboards (
  id VARCHAR(80) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  provider ENUM('Looker Studio', 'Superset', 'Grafana', 'Metabase', 'Power BI', 'Custom') NOT NULL,
  category_id VARCHAR(80) NOT NULL,
  owner_team_id VARCHAR(80) NOT NULL,
  owner_user_id VARCHAR(80) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  status ENUM('draft', 'in_review', 'published', 'rejected', 'archived') NOT NULL DEFAULT 'draft',
  sensitivity ENUM('public', 'internal', 'confidential', 'restricted') NOT NULL DEFAULT 'internal',
  embed_url TEXT NOT NULL,
  external_url TEXT NOT NULL,
  embed_status ENUM('embeddable', 'unknown', 'external_only', 'blocked') NOT NULL DEFAULT 'unknown',
  embed_status_reason TEXT NOT NULL,
  refresh_frequency ENUM('unknown', 'daily', 'weekly', 'monthly', 'manual') NOT NULL DEFAULT 'unknown',
  data_source_note TEXT NULL,
  views INT NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP NULL,
  last_reviewed_at TIMESTAMP NULL,
  created_by VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_portal_dashboards_category
    FOREIGN KEY (category_id) REFERENCES portal_categories(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_portal_dashboards_owner_team
    FOREIGN KEY (owner_team_id) REFERENCES portal_teams(id)
    ON DELETE RESTRICT,
  INDEX idx_portal_dashboards_status (status),
  INDEX idx_portal_dashboards_sensitivity (sensitivity),
  INDEX idx_portal_dashboards_category (category_id),
  INDEX idx_portal_dashboards_owner_team (owner_team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_tags (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_dashboard_tags (
  dashboard_id VARCHAR(80) NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (dashboard_id, tag_id),
  CONSTRAINT fk_portal_dashboard_tags_dashboard
    FOREIGN KEY (dashboard_id) REFERENCES portal_dashboards(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_portal_dashboard_tags_tag
    FOREIGN KEY (tag_id) REFERENCES portal_tags(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_favorites (
  user_id VARCHAR(80) NOT NULL,
  dashboard_id VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, dashboard_id),
  CONSTRAINT fk_portal_favorites_dashboard
    FOREIGN KEY (dashboard_id) REFERENCES portal_dashboards(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_category_scopes (
  user_id VARCHAR(80) NOT NULL,
  team_id VARCHAR(80) NOT NULL,
  category_id VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, category_id),
  CONSTRAINT fk_portal_category_scopes_team
    FOREIGN KEY (team_id) REFERENCES portal_teams(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_portal_category_scopes_category
    FOREIGN KEY (category_id) REFERENCES portal_categories(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_audit_logs (
  id VARCHAR(80) PRIMARY KEY,
  actor_user_id VARCHAR(80) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  action VARCHAR(120) NOT NULL,
  entity_type ENUM('dashboard', 'category', 'permission') NOT NULL,
  entity_id VARCHAR(80) NOT NULL,
  entity_title VARCHAR(255) NOT NULL,
  note TEXT NOT NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_portal_audit_logs_entity (entity_type, entity_id),
  INDEX idx_portal_audit_logs_action (action),
  INDEX idx_portal_audit_logs_actor (actor_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO portal_teams (id, name) VALUES
  ('team-executive', 'Executive Analytics Team'),
  ('team-ops', 'Operations Command Center'),
  ('team-digital-health', 'Digital Health Strategy'),
  ('team-public-data', 'Public Health Data Office');

INSERT IGNORE INTO portal_categories (id, name, parent_id, owner_team_id, sort_order, created_by) VALUES
  ('executive', 'Executive Overview', NULL, 'team-executive', 10, 'seed'),
  ('executive-kpi', 'KPI ภาพรวม', 'executive', 'team-executive', 11, 'seed'),
  ('executive-region', 'เขตสุขภาพ', 'executive', 'team-executive', 12, 'seed'),
  ('operations', 'Service Operations', NULL, 'team-ops', 20, 'seed'),
  ('operations-bed', 'เตียงและทรัพยากร', 'operations', 'team-ops', 21, 'seed'),
  ('operations-opd', 'OPD/IPD', 'operations', 'team-ops', 22, 'seed'),
  ('digital-health', 'Digital Health Projects', NULL, 'team-digital-health', 30, 'seed'),
  ('digital-health-sso', 'SSO Adoption', 'digital-health', 'team-digital-health', 31, 'seed'),
  ('digital-health-data', 'Data Platform', 'digital-health', 'team-digital-health', 32, 'seed');

INSERT IGNORE INTO portal_category_scopes (user_id, team_id, category_id) VALUES
  ('u-001', 'team-digital-health', 'digital-health'),
  ('u-001', 'team-digital-health', 'digital-health-sso'),
  ('u-001', 'team-digital-health', 'digital-health-data');

