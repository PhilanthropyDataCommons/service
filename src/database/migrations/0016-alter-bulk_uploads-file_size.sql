ALTER TABLE bulk_uploads
  ADD COLUMN file_size INTEGER;

COMMENT ON COLUMN bulk_uploads.file_size IS
  'The file size, in bytes, of a bulk upload CSV.';
