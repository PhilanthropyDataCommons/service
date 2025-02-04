UPDATE user_group_data_provider_permissions
SET not_after = now()
WHERE
	keycloak_organization_id = :keycloakOrganizationId
	AND permission = :permission
	AND data_provider_short_code = :dataProviderShortCode
	AND NOT is_expired(not_after);
