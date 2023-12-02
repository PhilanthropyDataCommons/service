ALTER TABLE bulk_uploads
  DROP COLUMN source_url;

ALTER TABLE bulk_uploads
  ADD COLUMN source_key VARCHAR NOT NULL;

COMMENT ON COLUMN bulk_uploads.source_key IS
  'An S3 key in the PDC S3 bucket that references the csv containing the data to be processed.';
