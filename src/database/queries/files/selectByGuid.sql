SELECT file_to_json(files.*) AS object
FROM files
WHERE
	guid = :fileUuid
	AND (
		created_by = :authContextKeycloakUserId
		OR :authContextIsAdministrator::boolean
	);
