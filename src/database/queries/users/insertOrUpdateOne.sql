INSERT INTO users (
	keycloak_user_id
)
VALUES (
	:keycloakUserId
)
ON CONFLICT (keycloak_user_id)
DO UPDATE
	SET
		keycloak_user_id = excluded.keycloak_user_id
RETURNING user_to_json(users) AS object;
