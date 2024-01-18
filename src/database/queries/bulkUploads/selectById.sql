SELECT
  id as "id",
  file_name as "fileName",
  source_key as "sourceKey",
  status as "status",
  file_size as "fileSize",
  created_at AS "createdAt"
FROM bulk_uploads
WHERE id = :id;
