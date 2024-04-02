SELECT bulk_upload_to_json(bulk_uploads.*) as "object"
FROM bulk_uploads
ORDER BY id DESC
LIMIT
  CASE WHEN :limit != 0 THEN
    :limit
  ELSE
    NULL
  END
OFFSET :offset
