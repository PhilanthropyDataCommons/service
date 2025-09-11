-- Create s3_buckets table
CREATE TABLE s3_buckets (
	name text PRIMARY KEY,
	region text NOT NULL,
	endpoint text NOT NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now()
);

SELECT audit_table('s3_buckets');

-- Insert unique bucket combinations from existing files
-- Using the currently configured S3 endpoint as the endpoint
INSERT INTO s3_buckets (name, region, endpoint)
SELECT DISTINCT
	bucket_name,
	bucket_region,
	current_setting('app.s3_endpoint') AS endpoint
FROM files
ON CONFLICT (name) DO NOTHING;

-- Add s3_bucket_name column to files table
ALTER TABLE files
ADD COLUMN s3_bucket_name text REFERENCES s3_buckets (name);

-- Update files to reference the appropriate s3_bucket
UPDATE files
SET s3_bucket_name = s3_buckets.name
FROM s3_buckets
WHERE files.bucket_name = s3_buckets.name;

-- Make s3_bucket_name NOT NULL after populating it
ALTER TABLE files
ALTER COLUMN s3_bucket_name SET NOT NULL;

-- Remove the old bucket columns from files table
-- These are now normalized in the s3_buckets table
ALTER TABLE files
DROP COLUMN bucket_name,
DROP COLUMN bucket_region;
