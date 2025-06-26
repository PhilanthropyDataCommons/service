INSERT INTO funders (
	short_code,
	name,
	keycloak_organization_id,
	is_collaborative
) VALUES (
	:shortCode,
	:name,
	:keycloakOrganizationId,
	:isCollaborative
)
ON CONFLICT (short_code)
DO UPDATE
	SET
		name = excluded.name,
		keycloak_organization_id = excluded.keycloak_organization_id,
		is_collaborative = excluded.is_collaborative
RETURNING funder_to_json(funders) AS object;
