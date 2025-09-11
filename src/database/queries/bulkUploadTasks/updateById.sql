UPDATE bulk_upload_tasks
SET
	status = coalesce(:status, status)
WHERE id = :bulkUploadTaskId
RETURNING bulk_upload_task_to_json(bulk_upload_tasks) AS object;
