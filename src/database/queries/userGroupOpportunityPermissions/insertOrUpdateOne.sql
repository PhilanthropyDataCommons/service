INSERT INTO user_group_opportunity_permissions (
	keycloak_organization_id,
	opportunity_permission,
	opportunity_id,
	created_by,
	not_after
) VALUES (
	:keycloakOrganizationId,
	:opportunityPermission,
	:opportunityId,
	:authContextKeycloakUserId,
	NULL
)
ON CONFLICT (
	keycloak_organization_id, opportunity_permission, opportunity_id
) DO UPDATE
	SET not_after = NULL
RETURNING
	user_group_opportunity_permission_to_json(user_group_opportunity_permissions)
		AS object;
