INSERT INTO users (
	keycloak_user_id,
	keycloak_user_name
)
VALUES (
	:keycloakUserId,
	:keycloakUserName
)
ON CONFLICT (keycloak_user_id)
DO UPDATE
	SET
		keycloak_user_id = excluded.keycloak_user_id,
		keycloak_user_name = excluded.keycloak_user_name
RETURNING
	user_to_json(
		users.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object;
