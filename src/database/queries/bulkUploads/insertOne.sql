INSERT INTO bulk_uploads (
  source_id,
  file_name,
  source_key,
  status,
  created_by
)
VALUES (
  :sourceId,
  :fileName,
  :sourceKey,
  :status,
  :createdBy
)
RETURNING bulk_upload_to_json(bulk_uploads) AS "object";
