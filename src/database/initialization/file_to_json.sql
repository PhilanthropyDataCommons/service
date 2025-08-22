SELECT drop_function('file_to_json');

CREATE FUNCTION file_to_json(file_record files)
RETURNS jsonb AS $$
DECLARE
  file_json JSONB := NULL::JSONB;
BEGIN
  SELECT jsonb_object_agg(name, value)
  INTO file_json
  FROM (VALUES
    ('guid', to_jsonb(file_record.uuid)),
    ('mimeType', to_jsonb(file_record.mime_type)),
    ('size', to_jsonb(file_record.size)),
    ('createdBy', to_jsonb(file_record.created_by)),
    ('createdAt', to_jsonb(file_record.created_at))
  ) AS props(name, value)
  WHERE value IS NOT NULL;

  RETURN file_json;
END;
$$ LANGUAGE plpgsql;
