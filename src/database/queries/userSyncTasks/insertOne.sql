INSERT INTO user_sync_tasks (
	status,
	created_by
)
VALUES (
	:status,
	auth_context_user_keycloak_user_id(:authContextId)
)
RETURNING
	user_sync_task_to_json(user_sync_tasks) AS object;
