SELECT sync_basefield_to_json(sync_basefields.*) as "object"
FROM sync_basefields
WHERE
  CASE
    WHEN :createdBy::UUID IS NULL THEN
      true
    ELSE
      sync_basefields.created_by = :createdBy
    END
  AND CASE
    WHEN :authContextKeycloakUserId::UUID IS NULL THEN
      true
    ELSE
      (
        sync_basefields.created_by = :authContextKeycloakUserId
        OR :authContextIsAdministrator::boolean
      )
    END
ORDER BY id DESC
LIMIT :limit
OFFSET :offset
