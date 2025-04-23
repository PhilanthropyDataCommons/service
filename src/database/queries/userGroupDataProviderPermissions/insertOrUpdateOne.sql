INSERT INTO user_group_data_provider_permissions (
	keycloak_organization_id,
	permission,
	data_provider_short_code,
	created_by,
	not_after
) VALUES (
	:keycloakOrganizationId,
	:permission,
	:dataProviderShortCode,
	:authContextKeycloakUserId,
	null
)
ON CONFLICT (
	keycloak_organization_id, permission, data_provider_short_code
) DO UPDATE
	SET not_after = null
RETURNING
	user_group_data_provider_permission_to_json(
		user_group_data_provider_permissions
	)
		AS object;
