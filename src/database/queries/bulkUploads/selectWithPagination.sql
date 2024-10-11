SELECT bulk_upload_to_json(bulk_uploads.*) as "object"
FROM bulk_uploads
WHERE
  CASE
    WHEN :createdBy::UUID IS NULL THEN
      true
    ELSE
      bulk_uploads.created_by = :createdBy
    END
  AND CASE
    WHEN :userId::UUID IS NULL THEN
      true
    ELSE
      (
        bulk_uploads.created_by = :userId
        OR :isAdministrator::boolean
      )
    END
ORDER BY id DESC
LIMIT :limit
OFFSET :offset
