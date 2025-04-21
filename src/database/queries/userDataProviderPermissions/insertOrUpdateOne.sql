INSERT INTO user_data_provider_permissions (
	user_keycloak_user_id,
	permission,
	data_provider_short_code,
	created_by,
	not_after
) VALUES (
	:userKeycloakUserId,
	:permission::permission_t,
	:dataProviderShortCode,
	:authContextKeycloakUserId,
	null
)
ON CONFLICT (
	user_keycloak_user_id, permission, data_provider_short_code
) DO UPDATE
	SET not_after = null
RETURNING user_data_provider_permission_to_json(user_data_provider_permissions)
	AS object;
