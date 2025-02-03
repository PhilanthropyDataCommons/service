SELECT exists(
	SELECT 1
	FROM user_group_funder_permissions
	WHERE
		keycloak_organization_id = :keycloakOrganizationId
		AND funder_short_code = :funderShortCode
		AND permission = :permission
		AND NOT is_expired(not_after)
) AS result;
