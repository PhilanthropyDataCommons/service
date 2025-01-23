UPDATE bulk_upload_tasks
SET
	file_size = coalesce(:fileSize, file_size),
	source_key = coalesce(:sourceKey, source_key),
	status = coalesce(:status, status)
WHERE id = :bulkUploadTaskId
RETURNING bulk_upload_task_to_json(bulk_upload_tasks) AS object;
