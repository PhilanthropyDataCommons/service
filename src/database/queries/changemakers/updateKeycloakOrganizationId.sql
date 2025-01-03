UPDATE changemakers
SET keycloak_organization_id = :keycloakOrganizationId
WHERE id = :id
RETURNING changemaker_to_json(changemakers) AS object;
