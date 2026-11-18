SELECT drop_function('auth_context_user_keycloak_user_id');

-- Returns the Keycloak user id of the user acting through `auth_context_id`,
-- or NULL if that auth context has expired.
CREATE FUNCTION auth_context_user_keycloak_user_id(
	auth_context_id text
) RETURNS uuid AS $$
	SELECT ephemeral_auth_contexts.user_keycloak_user_id
	FROM ephemeral_auth_contexts
	WHERE ephemeral_auth_contexts.token_id
		= auth_context_user_keycloak_user_id.auth_context_id
		AND NOT is_expired(ephemeral_auth_contexts.not_after);
$$ LANGUAGE sql STABLE;
