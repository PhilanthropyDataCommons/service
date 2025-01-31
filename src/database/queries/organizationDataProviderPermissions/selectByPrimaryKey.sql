SELECT
	organization_data_provider_permission_to_json(
		organization_data_provider_permissions.*
	) AS object
FROM organization_data_provider_permissions
WHERE
	keycloak_organization_id = :keycloakOrganizationId
	AND data_provider_short_code = :dataProviderShortCode
	AND permission = :permission
	AND NOT is_expired(not_after);
