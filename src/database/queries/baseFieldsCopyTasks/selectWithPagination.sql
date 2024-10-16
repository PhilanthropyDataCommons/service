SELECT base_fields_copy_task_to_json(base_fields_copy_tasks.*) AS object
FROM base_fields_copy_tasks
WHERE
	CASE
		WHEN :createdBy::uuid IS NULL THEN
			TRUE
		ELSE
			created_by = :createdBy
	END
	AND
	CASE
		WHEN :authContextKeycloakUserId::uuid IS NULL THEN
			TRUE
		ELSE
			(
				created_by = :authContextKeycloakUserId
				OR :authContextIsAdministrator::boolean
			)
	END
ORDER BY id DESC
LIMIT
	:limit
	OFFSET :offset;
