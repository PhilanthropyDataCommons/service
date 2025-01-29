SELECT exists(
	SELECT 1
	FROM organization_data_provider_permissions
	WHERE
		organization_keycloak_id = :organizationKeycloakId
		AND data_provider_short_code = :dataProviderShortCode
		AND permission = :permission
		AND NOT is_expired(not_after)
) AS result;
