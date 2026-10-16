UPDATE users
SET disabled_at = now()
WHERE
	disabled_at IS NULL
	AND users.keycloak_user_id <> system_keycloak_user_id()
	AND NOT EXISTS (
		SELECT 1
		FROM jsonb_array_elements(:users::jsonb) AS value
		WHERE
			value ->> 'id' = users.keycloak_user_id::text
			AND coalesce((value ->> 'enabled')::boolean, FALSE)
	)
RETURNING users.keycloak_user_id;
