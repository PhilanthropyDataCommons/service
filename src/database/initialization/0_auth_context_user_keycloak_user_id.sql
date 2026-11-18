SELECT drop_function('auth_context_user_keycloak_user_id');

-- Returns the Keycloak user id of the user acting through `auth_context_id`.
CREATE FUNCTION auth_context_user_keycloak_user_id(
	auth_context_id text
) RETURNS uuid AS $$
	SELECT ephemeral_auth_contexts.user_keycloak_user_id
	FROM ephemeral_auth_contexts
	WHERE ephemeral_auth_contexts.token_id
		= auth_context_user_keycloak_user_id.auth_context_id;
$$ LANGUAGE sql STABLE;
