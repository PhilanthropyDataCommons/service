UPDATE base_fields_copy_tasks
SET
	status = coalesce(:status, status)
WHERE id = :baseFieldsCopyTaskId
RETURNING base_fields_copy_task_to_json(base_fields_copy_tasks) AS object;
