SELECT organization_sync_task_to_json(organization_sync_tasks.*) AS object
FROM organization_sync_tasks
WHERE
	id = :organizationSyncTaskId
	AND (
		:authContextKeycloakUserId::uuid IS NULL
		OR organization_sync_tasks.created_by = :authContextKeycloakUserId
		OR :authContextIsAdministrator::boolean
	);
