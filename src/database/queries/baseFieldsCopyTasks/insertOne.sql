INSERT INTO base_fields_copy_tasks (
  status,
  status_updated_at,
  synchronization_url,
  created_by
)
VALUES (
  :status,
  :statusUpdatedAt,
  :synchronizationUrl,
  :createdBy
)
RETURNING base_fields_copy_task_to_json(base_fields_copy_tasks) AS "object";
