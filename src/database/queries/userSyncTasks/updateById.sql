UPDATE user_sync_tasks
SET
	status = update_if(:statusWasProvided, :status, status),
	status_updated_at = update_if(
		:statusUpdatedAtWasProvided,
		:statusUpdatedAt,
		status_updated_at
	),
	details = update_if(:detailsWasProvided, :details::jsonb, details)
WHERE id = :userSyncTaskId
RETURNING
	user_sync_task_to_json(user_sync_tasks.*) AS object;
