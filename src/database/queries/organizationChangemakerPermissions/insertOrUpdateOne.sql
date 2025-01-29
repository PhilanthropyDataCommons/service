INSERT INTO organzation_changemaker_permissions (
	organization_keycloak_id,
	permission,
	changemaker_id,
	created_by,
	not_after
) VALUES (
	:organizationKeycloakId,
	:permission::permission_t,
	:changemakerId,
	:createdBy,
	null
)
ON CONFLICT (organization_keycloak_id, permission, changemaker_id) DO UPDATE
SET not_after = null
RETURNING organization_changemaker_permission_to_json(organization_changemaker_permissions)
	AS object;
