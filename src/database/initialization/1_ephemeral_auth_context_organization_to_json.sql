SELECT drop_function('ephemeral_auth_context_organization_to_json');

CREATE FUNCTION ephemeral_auth_context_organization_to_json(
	ephemeral_auth_context_organization ephemeral_auth_context_organizations
)
RETURNS jsonb AS $$
BEGIN
	RETURN jsonb_build_object(
		'authContextId', ephemeral_auth_context_organization.auth_context_id,
		'keycloakOrganizationId',
		ephemeral_auth_context_organization.keycloak_organization_id,
		'createdAt',
		to_json(ephemeral_auth_context_organization.created_at)::jsonb
	);
END;
$$ LANGUAGE plpgsql;
