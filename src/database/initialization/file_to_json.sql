SELECT drop_function('file_to_json');

CREATE FUNCTION file_to_json(file files)
RETURNS jsonb AS $$
DECLARE
  file_json JSONB := NULL::JSONB;
BEGIN
  SELECT jsonb_object_agg(name, value)
  INTO file_json
  FROM (VALUES
    ('id', to_jsonb(file.id)),
    ('name', to_jsonb(file.name)),
    ('storageKey', to_jsonb(file.storage_key)),
    ('mimeType', to_jsonb(file.mime_type)),
    ('size', to_jsonb(file.size)),
    ('bucketName', to_jsonb(file.bucket_name)),
    ('bucketRegion', to_jsonb(file.bucket_region)),
    ('createdBy', to_jsonb(file.created_by)),
    ('createdAt', to_jsonb(file.created_at))
  ) AS props(name, value)
  WHERE value IS NOT NULL;

  RETURN file_json;
END;
$$ LANGUAGE plpgsql;
