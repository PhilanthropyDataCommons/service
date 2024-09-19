CREATE OR REPLACE FUNCTION bulk_upload_to_json(bulk_upload bulk_uploads)
RETURNS JSONB AS $$
DECLARE
  source_json JSONB;
BEGIN
  SELECT source_to_json(sources.*)
  INTO source_json
  FROM sources
  WHERE sources.id = bulk_upload.source_id;

  RETURN jsonb_build_object(
    'id', bulk_upload.id,
    'sourceId', bulk_upload.source_id,
    'source', source_json,
    'fileName', bulk_upload.file_name,
    'sourceKey', bulk_upload.source_key,
    'status', bulk_upload.status,
    'fileSize', bulk_upload.file_size,
    'createdBy', bulk_upload.created_by,
    'createdAt', to_json(bulk_upload.created_at)::jsonb
  );
END;
$$ LANGUAGE plpgsql;
