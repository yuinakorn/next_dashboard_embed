CREATE TABLE IF NOT EXISTS portal_users (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  team_id VARCHAR(80) NOT NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'manual',
  last_seen_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_portal_users_team
    FOREIGN KEY (team_id) REFERENCES portal_teams(id)
    ON DELETE RESTRICT,
  INDEX idx_portal_users_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portal_user_roles (
  user_id VARCHAR(80) NOT NULL,
  role ENUM('system_admin', 'category_admin', 'project_manager', 'editor', 'viewer') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role),
  CONSTRAINT fk_portal_user_roles_user
    FOREIGN KEY (user_id) REFERENCES portal_users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO portal_users (id, name, title, department, team_id, source) VALUES
  ('u-001', 'Nakhon Mongkolchotyada', 'Digital health project manager', 'Digital Health Strategy', 'team-digital-health', 'seed'),
  ('seed-admin', 'Portal System Admin', 'System administrator', 'Platform Administration', 'team-executive', 'seed');

INSERT IGNORE INTO portal_user_roles (user_id, role) VALUES
  ('u-001', 'category_admin'),
  ('u-001', 'project_manager'),
  ('u-001', 'editor'),
  ('u-001', 'viewer'),
  ('seed-admin', 'system_admin'),
  ('seed-admin', 'viewer');
