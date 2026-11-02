SELECT drop_function('user_sync_task_to_json');

CREATE FUNCTION user_sync_task_to_json(user_sync_task user_sync_tasks)
RETURNS jsonb AS $$
BEGIN
	RETURN jsonb_build_object(
		'id', user_sync_task.id,
		'status', user_sync_task.status,
		'statusUpdatedAt', to_json(user_sync_task.status_updated_at)::jsonb,
		'details', user_sync_task.details,
		'createdAt', to_json(user_sync_task.created_at)::jsonb,
		'createdBy', user_sync_task.created_by
	);
END;
$$ LANGUAGE plpgsql;
