SELECT user_sync_task_to_json(user_sync_tasks.*) AS object
FROM user_sync_tasks
WHERE
	id = :userSyncTaskId
	AND (
		:authContextKeycloakUserId::uuid IS NULL
		OR user_sync_tasks.created_by = :authContextKeycloakUserId
		OR :authContextIsAdministrator::boolean
	);
