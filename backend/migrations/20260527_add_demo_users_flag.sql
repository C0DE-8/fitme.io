ALTER TABLE users
  ADD COLUMN is_demo TINYINT(1) NOT NULL DEFAULT 0 AFTER verified;

CREATE INDEX idx_users_is_demo ON users (is_demo);
