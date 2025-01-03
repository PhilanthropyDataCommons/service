SELECT
	user_data_provider_permission_to_json(
		user_data_provider_permissions.*
	) AS object
FROM user_data_provider_permissions
WHERE
	user_keycloak_user_id = :userKeycloakUserId
	AND data_provider_short_code = :dataProviderShortCode
	AND permission = :permission
	AND NOT is_expired(not_after);
