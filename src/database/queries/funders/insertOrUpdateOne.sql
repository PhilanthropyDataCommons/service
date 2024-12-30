INSERT INTO funders (
	short_code,
	name,
	keycloak_organization_id
) VALUES (
	:shortCode,
	:name,
	:keycloakOrganizationId
)
ON CONFLICT (short_code)
DO UPDATE SET
name = excluded.name,
keycloak_organization_id = excluded.keycloak_organization_id
RETURNING funder_to_json(funders) AS object;
