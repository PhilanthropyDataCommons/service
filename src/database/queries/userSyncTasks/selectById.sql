SELECT user_sync_task_to_json(user_sync_tasks.*) AS object
FROM user_sync_tasks
WHERE
	id = :userSyncTaskId
	AND (
		:authContextId::text IS NULL
		OR user_sync_tasks.created_by
		= auth_context_user_keycloak_user_id(:authContextId)
		OR :authContextIsAdministrator::boolean
	);
