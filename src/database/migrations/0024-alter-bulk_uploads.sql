ALTER TABLE bulk_uploads
  ADD COLUMN created_by INTEGER NOT NULL DEFAULT select_system_user_id(),
  ADD CONSTRAINT fk_createdBy FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE bulk_uploads
  ALTER COLUMN created_by DROP DEFAULT;
