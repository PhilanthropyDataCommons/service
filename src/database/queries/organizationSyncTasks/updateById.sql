UPDATE organization_sync_tasks
SET
	status = update_if(:statusWasProvided, :status, status),
	status_updated_at = update_if(
		:statusUpdatedAtWasProvided,
		:statusUpdatedAt,
		status_updated_at
	),
	details = update_if(:detailsWasProvided, :details::jsonb, details)
WHERE id = :organizationSyncTaskId
RETURNING
	organization_sync_task_to_json(organization_sync_tasks.*) AS object;
