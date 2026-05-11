MERGE INTO users
USING (VALUES (
	:keycloakUserId::uuid,
	:keycloakUserName::varchar
)) AS source (
	keycloak_user_id,
	keycloak_user_name
)
ON users.keycloak_user_id = source.keycloak_user_id
WHEN MATCHED THEN UPDATE SET
	keycloak_user_name = source.keycloak_user_name
WHEN NOT MATCHED THEN INSERT (
	keycloak_user_id,
	keycloak_user_name
) VALUES (
	source.keycloak_user_id,
	source.keycloak_user_name
)
RETURNING
	user_to_json(
		users.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object,
	merge_action() = 'INSERT' AS "wasInserted";
