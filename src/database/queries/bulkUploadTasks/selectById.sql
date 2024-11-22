SELECT bulk_upload_task_to_json(bulk_upload_tasks.*) as object
FROM bulk_upload_tasks
WHERE id = :id;
