-- Add nullable file reference columns first
ALTER TABLE bulk_upload_tasks
ADD COLUMN proposals_data_file_id integer REFERENCES files (id)
ON DELETE CASCADE;

-- Create bucket entity based on current configuration (if it doesn't exist)
INSERT INTO s3_buckets (
	name,
	region,
	endpoint
)
VALUES (
	current_setting('app.s3_bucket'),
	current_setting('app.s3_region'),
	current_setting('app.s3_endpoint')
)
ON CONFLICT (name) DO NOTHING;

-- Create file entities from existing bulk_upload_tasks data
INSERT INTO files (
	name,
	storage_key,
	mime_type,
	size,
	s3_bucket_name,
	created_by,
	created_at
)
SELECT
	but.file_name,
	but.source_key::uuid,
	'text/csv' AS mime_type,
	but.file_size,
	current_setting('app.s3_bucket') AS s3_bucket_name,
	but.created_by,
	but.created_at
FROM bulk_upload_tasks AS but;

-- Update bulk_upload_tasks to reference the newly created files
UPDATE bulk_upload_tasks
SET proposals_data_file_id = files.id
FROM files
WHERE
	bulk_upload_tasks.source_key::uuid = files.storage_key
	AND bulk_upload_tasks.created_by = files.created_by;

-- Add NOT NULL constraint on proposals_data_file_id
ALTER TABLE bulk_upload_tasks
ALTER COLUMN proposals_data_file_id SET NOT NULL;

-- Drop the old file columns that are now redundant
ALTER TABLE bulk_upload_tasks
DROP COLUMN file_name,
DROP COLUMN source_key,
DROP COLUMN file_size;

-- Add comments to explain the new columns
COMMENT ON COLUMN bulk_upload_tasks.proposals_data_file_id
IS 'Reference to the file containing proposal data in the files table';
