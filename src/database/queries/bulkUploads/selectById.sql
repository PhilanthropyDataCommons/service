SELECT bulk_upload_to_json(bulk_uploads.*) as "object"
FROM bulk_uploads
WHERE id = :id;
