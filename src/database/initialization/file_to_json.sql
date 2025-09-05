SELECT drop_function('file_to_json');

CREATE FUNCTION file_to_json(file files)
RETURNS jsonb AS $$
DECLARE
  file_json JSONB := NULL::JSONB;
  s3_bucket_json JSONB := NULL::JSONB;
BEGIN
  -- Get the s3_bucket data
  SELECT s3_bucket_to_json(s3_buckets.*)
  INTO s3_bucket_json
  FROM s3_buckets
  WHERE s3_buckets.name = file.s3_bucket_name;

  SELECT jsonb_object_agg(name, value)
  INTO file_json
  FROM (VALUES
    ('id', to_jsonb(file.id)),
    ('name', to_jsonb(file.name)),
    ('storageKey', to_jsonb(file.storage_key)),
    ('mimeType', to_jsonb(file.mime_type)),
    ('size', to_jsonb(file.size)),
    ('s3BucketName', to_jsonb(file.s3_bucket_name)),
    ('s3Bucket', s3_bucket_json),
    ('createdBy', to_jsonb(file.created_by)),
    ('createdAt', to_jsonb(file.created_at))
  ) AS props(name, value)
  WHERE value IS NOT NULL;

  RETURN file_json;
END;
$$ LANGUAGE plpgsql;
