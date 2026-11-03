INSERT INTO organization_sync_tasks (
	status,
	created_by
)
VALUES (
	:status,
	:authContextKeycloakUserId
)
RETURNING
	organization_sync_task_to_json(organization_sync_tasks) AS object;
