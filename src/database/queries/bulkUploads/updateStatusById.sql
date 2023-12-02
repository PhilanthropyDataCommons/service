UPDATE bulk_uploads SET
  status = :status
WHERE id = :id
RETURNING
  id as "id",
  file_name as "fileName",
  source_key as "sourceKey",
  status as "status",
  created_at AS "createdAt"

