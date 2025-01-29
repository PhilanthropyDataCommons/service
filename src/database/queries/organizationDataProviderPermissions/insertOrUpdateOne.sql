INSERT INTO organization_data_provider_permissions (
	organization_keycloak_id,
	permission,
	data_provider_short_code,
	created_by,
	not_after
) VALUES (
	:organizationKeycloakId,
	:permission::permission_t,
	:dataProviderShortCode,
	:createdBy,
	null
)
ON CONFLICT (
	organization_keycloak_id, permission, data_provider_short_code
) DO UPDATE
SET not_after = null
RETURNING organization_data_provider_permission_to_json(organization_data_provider_permissions)
	AS object;
