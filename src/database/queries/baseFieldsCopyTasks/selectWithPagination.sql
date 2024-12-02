SELECT base_fields_copy_task_to_json(base_fields_copy_tasks.*) as "object"
FROM base_fields_copy_tasks
WHERE
  CASE
    WHEN :createdBy::UUID IS NULL THEN
      true
    ELSE
      base_fields_copy_tasks.created_by = :createdBy
    END
  AND CASE
    WHEN :authContextKeycloakUserId::UUID IS NULL THEN
      true
    ELSE
      (
        base_fields_copy_tasks.created_by = :authContextKeycloakUserId
        OR :authContextIsAdministrator::boolean
      )
    END
ORDER BY id DESC
LIMIT :limit
OFFSET :offset
