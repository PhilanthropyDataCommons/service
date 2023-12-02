INSERT INTO bulk_uploads (
  file_name,
  source_key,
  status
)
VALUES (
  :fileName,
  :sourceKey,
  :status
)
RETURNING
  id as "id",
  file_name as "fileName",
  source_key as "sourceKey",
  status as "status",
  created_at AS "createdAt"
