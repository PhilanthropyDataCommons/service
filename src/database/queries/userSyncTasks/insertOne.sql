INSERT INTO user_sync_tasks (
	status,
	created_by
)
VALUES (
	:status,
	:authContextKeycloakUserId
)
RETURNING
	user_sync_task_to_json(user_sync_tasks) AS object;
