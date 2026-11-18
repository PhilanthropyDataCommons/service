INSERT INTO ephemeral_auth_context_organizations (
	auth_context_id,
	keycloak_organization_id
) VALUES (
	:authContextId::text,
	:keycloakOrganizationId::uuid
)
RETURNING
	ephemeral_auth_context_organization_to_json(
		ephemeral_auth_context_organizations
	) AS object;
