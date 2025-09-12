-- Add nullable attachments archive file reference column
ALTER TABLE bulk_upload_tasks
ADD COLUMN attachments_archive_file_id integer REFERENCES files (id)
ON DELETE SET NULL;

-- Add comment to explain the new column
COMMENT ON COLUMN bulk_upload_tasks.attachments_archive_file_id
IS 'Reference to optional file containing attachment archives';
