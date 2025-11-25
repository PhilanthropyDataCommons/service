UPDATE changemakers
SET
	tax_id = update_if(:taxIdWasProvided, :taxId, tax_id),
	name = update_if(:nameWasProvided, :name, name),
	keycloak_organization_id = update_if(
		:keycloakOrganizationIdWasProvided,
		:keycloakOrganizationId,
		keycloak_organization_id
	)
WHERE id = :changemakerId
RETURNING changemaker_to_json(changemakers) AS object;
