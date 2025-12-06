ALTER TABLE users ADD COLUMN password_hash TEXT;

UPDATE users SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/LV6' WHERE password_hash IS NULL;

ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);