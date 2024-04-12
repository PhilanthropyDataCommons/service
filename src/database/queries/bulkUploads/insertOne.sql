INSERT INTO bulk_uploads (
  file_name,
  source_key,
  status,
  created_by
)
VALUES (
  :fileName,
  :sourceKey,
  :status,
  :createdBy
)
RETURNING bulk_upload_to_json(bulk_uploads) AS "object";
