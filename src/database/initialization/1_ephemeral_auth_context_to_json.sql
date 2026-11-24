SELECT drop_function('ephemeral_auth_context_to_json');

CREATE FUNCTION ephemeral_auth_context_to_json(
	ephemeral_auth_context ephemeral_auth_contexts
)
RETURNS jsonb AS $$
BEGIN
	RETURN jsonb_build_object(
		'tokenId', ephemeral_auth_context.token_id,
		'userKeycloakUserId', ephemeral_auth_context.user_keycloak_user_id,
		'notAfter', to_json(ephemeral_auth_context.not_after)::jsonb,
		'createdAt', to_json(ephemeral_auth_context.created_at)::jsonb
	);
END;
$$ LANGUAGE plpgsql;
