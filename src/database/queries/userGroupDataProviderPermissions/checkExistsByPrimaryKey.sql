SELECT exists(
	SELECT 1
	FROM user_group_data_provider_permissions
	WHERE
		keycloak_organization_id = :keycloakOrganizationId
		AND data_provider_short_code = :dataProviderShortCode
		AND permission = :permission
		AND NOT is_expired(not_after)
) AS result;
