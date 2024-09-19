ALTER TABLE bulk_uploads
  ADD COLUMN source_id INTEGER NOT NULL DEFAULT system_source_id(),
  ADD CONSTRAINT fk_source_id
    FOREIGN KEY(source_id)
      REFERENCES sources(id);

ALTER TABLE bulk_uploads
  ALTER COLUMN source_id DROP DEFAULT;


COMMENT ON COLUMN bulk_uploads.source_id IS
  'The PDC source that the contents of the bulk upload came from.';
