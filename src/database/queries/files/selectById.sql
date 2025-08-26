SELECT file_to_json(files.*) AS object
FROM files
WHERE
	id = :fileId
	AND (
		created_by = :authContextKeycloakUserId
		OR :authContextIsAdministrator::boolean
	);
