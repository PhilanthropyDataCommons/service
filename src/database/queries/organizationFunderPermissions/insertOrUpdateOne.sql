INSERT INTO organization_funder_permissions (
	keycloak_organization_id,
	permission,
	funder_short_code,
	created_by,
	not_after
) VALUES (
	:keycloakOrganizationId,
	:permission::permission_t,
	:funderShortCode,
	:createdBy,
	NULL
)
ON CONFLICT (keycloak_organization_id, permission, funder_short_code) DO UPDATE
SET not_after = NULL
RETURNING
	organization_funder_permission_to_json(organization_funder_permissions)
    AS object;
