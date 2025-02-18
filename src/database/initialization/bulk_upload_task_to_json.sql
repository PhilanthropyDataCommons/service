SELECT drop_function('bulk_upload_task_to_json');

CREATE FUNCTION bulk_upload_task_to_json(bulk_upload_task bulk_upload_tasks)
RETURNS jsonb AS $$
DECLARE
  source_json JSONB;
  funder_json JSONB;
BEGIN
  SELECT source_to_json(sources.*)
  INTO source_json
  FROM sources
  WHERE sources.id = bulk_upload_task.source_id;

  SELECT funder_to_json(funders.*)
  INTO funder_json
  FROM funders
  WHERE funders.short_code = bulk_upload_task.funder_short_code;

  RETURN jsonb_build_object(
    'id', bulk_upload_task.id,
    'sourceId', bulk_upload_task.source_id,
    'source', source_json,
    'funderShortCode', bulk_upload_task.funder_short_code,
		'funder', funder_json,
    'fileName', bulk_upload_task.file_name,
    'sourceKey', bulk_upload_task.source_key,
    'status', bulk_upload_task.status,
    'fileSize', bulk_upload_task.file_size,
    'createdBy', bulk_upload_task.created_by,
    'createdAt', to_json(bulk_upload_task.created_at)::jsonb
  );
END;
$$ LANGUAGE plpgsql;
