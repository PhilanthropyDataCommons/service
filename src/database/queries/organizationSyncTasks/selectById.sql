SELECT organization_sync_task_to_json(organization_sync_tasks.*) AS object
FROM organization_sync_tasks
WHERE
	id = :organizationSyncTaskId
	AND (
		:authContextId::text IS NULL
		OR organization_sync_tasks.created_by
		= auth_context_user_keycloak_user_id(:authContextId)
		OR :authContextIsAdministrator::boolean
	);
