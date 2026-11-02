UPDATE users
SET
	disabled_at = clock_timestamp(),
	synced_from_keycloak_at = coalesce(
		:syncedFromKeycloakAt::timestamptz,
		users.synced_from_keycloak_at
	)
WHERE
	keycloak_user_id != system_keycloak_user_id()
	AND users.keycloak_user_id != all(:activeUsers::uuid[])
	AND (
		users.disabled_at IS NULL
		OR users.disabled_at != all(:skipDisabledAts::timestamptz[])
	)
RETURNING users.keycloak_user_id;
