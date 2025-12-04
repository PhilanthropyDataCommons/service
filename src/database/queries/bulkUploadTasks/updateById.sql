UPDATE bulk_upload_tasks
SET
	status = update_if(:statusWasProvided, :status, status)
WHERE id = :bulkUploadTaskId
RETURNING bulk_upload_task_to_json(
	bulk_upload_tasks,
	:authContextKeycloakUserId,
	:authContextIsAdministrator
) AS object;
