ALTER TABLE contacts ADD COLUMN IF NOT EXISTS device_contact_id TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS contacts_deleted_at_idx ON contacts(deleted_at);
