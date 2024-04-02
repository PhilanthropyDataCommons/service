UPDATE bulk_uploads
SET
  file_size =
    CASE WHEN :fileSize != -1 THEN
      :fileSize
    ELSE
      file_size
    END,
  source_key =
    CASE WHEN :sourceKey::text != '' THEN
      :sourceKey
    ELSE
      source_key
    END,
  status =
    CASE WHEN :status::text != '' THEN
      :status::bulk_upload_status
    ELSE
      status
    END
WHERE id = :id
RETURNING bulk_upload_to_json(bulk_uploads) AS "object";

