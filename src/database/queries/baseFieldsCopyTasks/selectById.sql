SELECT base_fields_copy_task_to_json(base_fields_copy_tasks.*) AS object
FROM base_fields_copy_tasks
WHERE id = :baseFieldsCopyTaskId;
