SELECT bulk_upload_task_to_json(bulk_upload_tasks.*) AS object
FROM bulk_upload_tasks
WHERE
	bulk_upload_tasks.id = :bulkUploadTaskId
	AND has_funder_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		bulk_upload_tasks.funder_short_code,
		'view'
	);
