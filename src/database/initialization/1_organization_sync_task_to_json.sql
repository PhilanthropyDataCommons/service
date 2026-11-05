SELECT drop_function('organization_sync_task_to_json');

CREATE FUNCTION organization_sync_task_to_json(
	organization_sync_task organization_sync_tasks
)
RETURNS jsonb AS $$
BEGIN
	RETURN jsonb_build_object(
		'id', organization_sync_task.id,
		'status', organization_sync_task.status,
		'statusUpdatedAt', to_json(organization_sync_task.status_updated_at)::jsonb,
		'details', organization_sync_task.details,
		'createdAt', to_json(organization_sync_task.created_at)::jsonb,
		'createdBy', organization_sync_task.created_by
	);
END;
$$ LANGUAGE plpgsql;
