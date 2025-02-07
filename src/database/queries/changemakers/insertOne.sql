INSERT INTO changemakers (
	tax_id,
	name,
	keycloak_organization_id
) VALUES (
	:taxId,
	:name,
	:keycloakOrganizationId
)
RETURNING changemaker_to_json(
	changemakers,
	:authContextKeycloakUserId,
	FALSE
) AS object;
