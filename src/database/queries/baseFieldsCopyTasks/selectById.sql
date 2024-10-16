SELECT base_fields_copy_task_to_json(base_fields_copy_tasks.*) as "object"
FROM base_fields_copy_tasks
WHERE id = :id;
