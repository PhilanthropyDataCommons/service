SELECT bulk_upload_task_to_json(bulk_upload_tasks.*) AS object
FROM bulk_upload_tasks
WHERE
  CASE
    WHEN :createdBy::UUID IS NULL THEN
      TRUE
    ELSE
      created_by = :createdBy
    END
  AND CASE
    WHEN :authContextKeycloakUserId::UUID IS NULL THEN
      TRUE
    ELSE
      (
        created_by = :authContextKeycloakUserId
        OR :authContextIsAdministrator::BOOLEAN
      )
    END
ORDER BY id DESC
LIMIT :limit
OFFSET :offset;
