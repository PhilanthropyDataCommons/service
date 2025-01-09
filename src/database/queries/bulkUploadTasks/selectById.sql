SELECT bulk_upload_task_to_json(bulk_upload_tasks.*) AS object
FROM bulk_upload_tasks
WHERE id = :bulkUploadTaskId;
