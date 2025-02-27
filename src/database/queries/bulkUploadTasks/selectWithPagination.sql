SELECT bulk_upload_task_to_json(bulk_upload_tasks.*) AS object
FROM bulk_upload_tasks
WHERE
	CASE
		WHEN :createdBy::uuid IS NULL THEN
			TRUE
		ELSE
			created_by = :createdBy
	END
	AND has_funder_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		funder_short_code,
		'view'
	)
ORDER BY id DESC
LIMIT :limit OFFSET :offset;
