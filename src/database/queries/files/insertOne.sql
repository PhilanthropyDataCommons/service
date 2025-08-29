INSERT INTO files (
	name,
	mime_type,
	size,
	bucket_name,
	bucket_region,
	created_by
)
VALUES (
	:name,
	:mimeType,
	:size,
	:bucketName,
	:bucketRegion,
	:authContextKeycloakUserId
)
RETURNING file_to_json(files) AS object;
