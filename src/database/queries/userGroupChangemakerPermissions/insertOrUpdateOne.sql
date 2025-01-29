INSERT INTO user_group_changemaker_permissions (
	keycloak_organization_id,
	permission,
	changemaker_id,
	created_by,
	not_after
) VALUES (
	:keycloakOrganizationId,
	:permission::permission_t,
	:changemakerId,
	:createdBy,
	null
)
ON CONFLICT (keycloak_organization_id, permission, changemaker_id) DO UPDATE
SET not_after = null
RETURNING
	user_group_changemaker_permission_to_json(
		user_group_changemaker_permissions
	)
		AS object;
