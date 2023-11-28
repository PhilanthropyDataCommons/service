INSERT INTO bulk_uploads (
  file_name,
  source_url,
  status
)
VALUES (
  :fileName,
  :sourceUrl,
  :status
)
RETURNING
  id as "id",
  file_name as "fileName",
  source_url as "sourceUrl",
  status as "status",
  created_at AS "createdAt"
