SELECT exists(
	SELECT 1
	FROM organization_funder_permissions
	WHERE
		organization_keycloak_id = :organizationKeycloakId
		AND funder_short_code = :funderShortCode
		AND permission = :permission
		AND NOT is_expired(not_after)
) AS result;
