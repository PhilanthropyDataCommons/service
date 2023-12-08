ALTER TABLE bulk_uploads
  RENAME COLUMN source_url TO source_key;

COMMENT ON COLUMN bulk_uploads.source_key IS
  'An S3 key in the PDC S3 bucket that references the csv containing the data to be processed.';
