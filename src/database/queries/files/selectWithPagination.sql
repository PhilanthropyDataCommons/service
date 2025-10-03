SELECT file_to_json(files.*) AS object
FROM files
WHERE
	CASE
		WHEN :createdBy::uuid IS NULL THEN
			TRUE
		ELSE
			created_by = :createdBy
	END
	AND (
		created_by = :authContextKeycloakUserId
		OR :authContextIsAdministrator::boolean
	)
ORDER BY id DESC
LIMIT :limit OFFSET :offset;
