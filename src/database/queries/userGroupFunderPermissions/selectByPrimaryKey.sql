SELECT
	user_group_funder_permission_to_json(
		user_group_funder_permissions.*
	) AS object
FROM user_group_funder_permissions
WHERE
	keycloak_organization_id = :keycloakOrganizationId
	AND funder_short_code = :funderShortCode
	AND permission = :permission
	AND NOT is_expired(not_after);
