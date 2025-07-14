UPDATE user_group_opportunity_permissions
SET not_after = now()
WHERE
	keycloak_organization_id = :keycloakOrganizationId
	AND opportunity_permission = :opportunityPermission::opportunity_permission_t
	AND opportunity_id = :opportunityId
	AND NOT is_expired(not_after)
RETURNING
	user_group_opportunity_permission_to_json(user_group_opportunity_permissions)
		AS object;
