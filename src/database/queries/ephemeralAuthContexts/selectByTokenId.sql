SELECT ephemeral_auth_context_to_json(ephemeral_auth_contexts.*) AS object
FROM ephemeral_auth_contexts
WHERE
	user_keycloak_user_id = :userKeycloakUserId::uuid
	AND token_id = :tokenId::text;
