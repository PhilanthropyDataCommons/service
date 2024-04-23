SELECT bulk_upload_to_json(bulk_uploads.*) as "object"
FROM bulk_uploads
WHERE
  CASE
    WHEN :createdBy != 0 THEN
      bulk_uploads.created_by = :createdBy
    ELSE
      true
    END
  AND CASE
    WHEN :userId != 0 THEN
      (
        bulk_uploads.created_by = :userId
        OR :isAdministrator
      )
    ELSE
      true
    END
ORDER BY id DESC
LIMIT
  CASE WHEN :limit != 0 THEN
    :limit
  ELSE
    NULL
  END
OFFSET :offset
