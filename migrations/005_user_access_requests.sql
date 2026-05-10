ALTER TABLE portal_users
  ADD COLUMN IF NOT EXISTS status ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'active' AFTER source,
  ADD COLUMN IF NOT EXISTS approved_by VARCHAR(80) NULL AFTER last_seen_at,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL AFTER approved_by,
  ADD COLUMN IF NOT EXISTS disabled_reason TEXT NULL AFTER approved_at;

UPDATE portal_users
SET status = 'active'
WHERE status IS NULL;

CREATE TABLE IF NOT EXISTS portal_access_requests (
  id VARCHAR(80) PRIMARY KEY,
  user_id VARCHAR(80) NOT NULL,
  requested_roles JSON NOT NULL,
  requested_category_ids JSON NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  reviewer_user_id VARCHAR(80) NULL,
  reviewer_name VARCHAR(255) NULL,
  review_note TEXT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_portal_access_requests_user
    FOREIGN KEY (user_id) REFERENCES portal_users(id)
    ON DELETE CASCADE,
  INDEX idx_portal_access_requests_user (user_id),
  INDEX idx_portal_access_requests_status (status),
  INDEX idx_portal_access_requests_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
