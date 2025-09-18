INSERT INTO changemakers (
	tax_id,
	name,
	keycloak_organization_id
) VALUES (
	:taxId,
	:name,
	:keycloakOrganizationId
)
ON CONFLICT (tax_id, name)
DO UPDATE SET tax_id = excluded.tax_id
RETURNING changemaker_to_json(
	changemakers,
	:authContextKeycloakUserId,
	FALSE
) AS object;
