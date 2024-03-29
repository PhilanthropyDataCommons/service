CREATE OR REPLACE FUNCTION bulk_upload_to_json(bulk_upload bulk_uploads)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'id', bulk_upload.id,
    'fileName', bulk_upload.file_name,
    'sourceKey', bulk_upload.source_key,
    'status', bulk_upload.status,
    'fileSize', bulk_upload.file_size,
    'createdAt', to_json(bulk_upload.created_at)::jsonb
  );
END;
$$ LANGUAGE plpgsql;
