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
RETURNING bulk_upload_to_json(bulk_uploads) AS "object";
