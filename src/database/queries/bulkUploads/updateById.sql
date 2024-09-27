UPDATE bulk_uploads
SET
  file_size = COALESCE(:fileSize, file_size),
  source_key = COALESCE(:sourceKey, source_key),
  status = COALESCE(:status, status)
WHERE id = :id
RETURNING bulk_upload_to_json(bulk_uploads) AS "object";

