INSERT INTO files (
	mime_type,
	size,
	created_by
)
VALUES (
	:mimeType,
	:size,
	:authContextKeycloakUserId
)
RETURNING file_to_json(files) AS object;
