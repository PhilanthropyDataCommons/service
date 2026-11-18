INSERT INTO ephemeral_auth_contexts (
	token_id,
	user_keycloak_user_id,
	not_after
) VALUES (
	:tokenId::text,
	:userKeycloakUserId::uuid,
	:notAfter::timestamptz
)
ON CONFLICT (token_id) DO UPDATE
	SET
		not_after = excluded.not_after
	WHERE
	ephemeral_auth_contexts.user_keycloak_user_id
	= excluded.user_keycloak_user_id
RETURNING
	ephemeral_auth_context_to_json(ephemeral_auth_contexts) AS object,
	xmax = 0 AS "wasInserted";
