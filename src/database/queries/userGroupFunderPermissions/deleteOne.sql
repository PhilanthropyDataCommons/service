UPDATE user_group_funder_permissions
SET not_after = now()
WHERE
	keycloak_organization_id = :keycloakOrganizationId
	AND permission = :permission
	AND funder_short_code = :funderShortCode
	AND NOT is_expired(not_after)
RETURNING
	user_group_funder_permission_to_json(user_group_funder_permissions)
		AS object;
