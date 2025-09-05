INSERT INTO files (
	name,
	mime_type,
	size,
	s3_bucket_name,
	created_by
)
VALUES (
	:name,
	:mimeType,
	:size,
	:s3BucketName,
	:authContextKeycloakUserId
)
RETURNING file_to_json(files) AS object;
