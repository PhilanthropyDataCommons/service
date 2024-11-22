UPDATE bulk_upload_tasks
SET
  file_size = COALESCE(:fileSize, file_size),
  source_key = COALESCE(:sourceKey, source_key),
  status = COALESCE(:status, status)
WHERE id = :id
RETURNING bulk_upload_task_to_json(bulk_upload_tasks) AS object;
