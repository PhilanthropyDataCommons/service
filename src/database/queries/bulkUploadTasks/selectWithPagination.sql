SELECT bulk_upload_task_to_json(bulk_upload_tasks.*) as object
FROM bulk_upload_tasks
WHERE
  CASE
    WHEN :createdBy::UUID IS NULL THEN
      true
    ELSE
      bulk_upload_tasks.created_by = :createdBy
    END
  AND CASE
    WHEN :authContextKeycloakUserId::UUID IS NULL THEN
      true
    ELSE
      (
        bulk_upload_tasks.created_by = :authContextKeycloakUserId
        OR :authContextIsAdministrator::boolean
      )
    END
ORDER BY id DESC
LIMIT :limit
OFFSET :offset
