SELECT drop_function('base_fields_copy_task_to_json');

CREATE FUNCTION base_fields_copy_task_to_json(base_fields_copy_task base_fields_copy_tasks)
RETURNS JSONB AS $$
DECLARE
  source_json JSONB;
BEGIN
  RETURN jsonb_build_object(
    'id', base_fields_copy_task.id,
    'status', base_fields_copy_task.status,
    'synchronizationUrl', base_fields_copy_task.synchronization_url,
    'statusUpdatedAt', to_json(base_fields_copy_task.status_updated_at)::jsonb,
    'createdAt', to_json(base_fields_copy_task.created_at)::jsonb,
    'createdBy', base_fields_copy_task.created_by
  );
END;
$$ LANGUAGE plpgsql;
