SELECT drop_function('grantee_permits_auth_context');

-- Returns TRUE when the grant's grantee covers the auth context
-- `auth_context_id`, according to our permission rules.
CREATE FUNCTION grantee_permits_auth_context(
	grantee_type permission_grant_grantee_type_t,
	grantee_user_keycloak_user_id uuid,
	grantee_keycloak_organization_id uuid,
	auth_context_id text
) RETURNS boolean AS $$
	SELECT grantee_type = 'authenticatedUsers'
		OR (
			grantee_type = 'user'
			AND grantee_user_keycloak_user_id
				= auth_context_user_keycloak_user_id(
					grantee_permits_auth_context.auth_context_id
				)
		)
		OR (
			grantee_type = 'userGroup'
			AND EXISTS (
				SELECT 1
				FROM ephemeral_auth_context_organizations organization
				WHERE organization.auth_context_id
						= grantee_permits_auth_context.auth_context_id
					AND organization.keycloak_organization_id
						= grantee_permits_auth_context.grantee_keycloak_organization_id
			)
		);
$$ LANGUAGE sql STABLE;
