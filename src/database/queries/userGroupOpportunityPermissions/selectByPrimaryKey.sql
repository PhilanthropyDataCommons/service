SELECT
	user_group_opportunity_permission_to_json(
		user_group_opportunity_permissions.*
	) AS object
FROM user_group_opportunity_permissions
WHERE
	keycloak_organization_id = :keycloakOrganizationId
	AND opportunity_id = :opportunityId
	AND opportunity_permission = :opportunityPermission
	AND NOT is_expired(not_after);
