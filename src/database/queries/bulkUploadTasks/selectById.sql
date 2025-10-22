SELECT
	bulk_upload_task_to_json(
		bulk_upload_tasks.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM bulk_upload_tasks
WHERE
	id = :bulkUploadTaskId
	AND has_funder_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		funder_short_code,
		'view'
	);
