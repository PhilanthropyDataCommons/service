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
	auth_context_user_keycloak_user_id(:authContextId)
)
RETURNING file_to_json(files) AS object;
