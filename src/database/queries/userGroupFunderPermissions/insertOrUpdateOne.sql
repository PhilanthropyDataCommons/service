INSERT INTO user_group_funder_permissions (
	keycloak_organization_id,
	permission,
	funder_short_code,
	created_by,
	not_after
) VALUES (
	:keycloakOrganizationId,
	:permission,
	:funderShortCode,
	:createdBy,
	NULL
)
ON CONFLICT (keycloak_organization_id, permission, funder_short_code) DO UPDATE
SET not_after = NULL
RETURNING
	user_group_funder_permission_to_json(user_group_funder_permissions)
		AS object;
