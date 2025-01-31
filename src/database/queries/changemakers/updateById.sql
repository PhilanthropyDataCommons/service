UPDATE changemakers
SET
	tax_id = coalesce(:taxId, tax_id),
	name = coalesce(:name, name),
	keycloak_organization_id = coalesce(
		:keycloakOrganizationId, keycloak_organization_id
	)
WHERE id = :changemakerId
RETURNING changemaker_to_json(changemakers) AS object;
