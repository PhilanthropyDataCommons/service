SELECT file_to_json(files.*) AS object
FROM files
WHERE
	id = :fileId
	AND (
		created_by = auth_context_user_keycloak_user_id(:authContextId)
		OR :authContextIsAdministrator::boolean
	);
