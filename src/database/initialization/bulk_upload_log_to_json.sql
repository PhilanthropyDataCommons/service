SELECT drop_function('bulk_upload_log_to_json');

CREATE FUNCTION bulk_upload_log_to_json(bulk_upload_log bulk_upload_logs)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'bulkUploadTaskId', bulk_upload_log.bulk_upload_task_id,
    'createdAt', to_json(bulk_upload_log.created_at)::jsonb,
    'isError', bulk_upload_log.is_error,
    'details', bulk_upload_log.details
  );
END;
$$ LANGUAGE plpgsql;
