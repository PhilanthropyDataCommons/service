INSERT INTO changemakers (
	tax_id,
	name,
	keycloak_organization_id,
	created_by
) VALUES (
	:taxId,
	:name,
	:keycloakOrganizationId,
	:authContextKeycloakUserId
)
RETURNING changemaker_to_json(
	changemakers,
	:authContextKeycloakUserId,
	FALSE
) AS object;
