CREATE TYPE bulk_upload_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed',
  'canceled'
);

CREATE TABLE bulk_uploads (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  file_name VARCHAR NOT NULL,
  source_url VARCHAR NOT NULL,
  status bulk_upload_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE bulk_uploads IS
  'Bulk upload operations for entering new opportunities and proposals into the system.';
COMMENT ON COLUMN bulk_uploads.source_url IS
  'A URL pointing to the csv containing the data to be processed.';
