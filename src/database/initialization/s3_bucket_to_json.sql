SELECT drop_function('s3_bucket_to_json');

CREATE FUNCTION s3_bucket_to_json(s3_bucket s3_buckets)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_object_agg(name, value)
  FROM (VALUES
    ('name', to_jsonb(s3_bucket.name)),
    ('region', to_jsonb(s3_bucket.region)),
    ('endpoint', to_jsonb(s3_bucket.endpoint)),
    ('createdAt', to_jsonb(s3_bucket.created_at))
  ) AS props(name, value)
  WHERE value IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
