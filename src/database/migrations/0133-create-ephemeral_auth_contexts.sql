CREATE TABLE ephemeral_auth_contexts (
	token_id text PRIMARY KEY,
	user_keycloak_user_id uuid NOT NULL
	REFERENCES users (keycloak_user_id) ON DELETE CASCADE,
	not_after timestamp with time zone NOT NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE ephemeral_auth_contexts IS
'Allows permission checks to be scoped in terms of the identity defined in a '
'given authentication token. This means a given authentication session can '
'provide more specific context beyond the full permission set a user might '
'have available to them in general.';

COMMENT ON COLUMN ephemeral_auth_contexts.token_id IS
'The identifier of the token this auth context was recorded from, such as '
'its JWT jti claim.';

COMMENT ON COLUMN ephemeral_auth_contexts.not_after IS
'The expiration time for this auth context.';

INSERT INTO ephemeral_auth_contexts (
	token_id,
	user_keycloak_user_id,
	not_after
) VALUES (
	'system',
	system_keycloak_user_id(),
	'infinity'
);

CREATE FUNCTION system_ephemeral_auth_context_token_id()
RETURNS text AS $$
	SELECT 'system'::text;
$$ LANGUAGE sql IMMUTABLE;

SELECT audit_table('ephemeral_auth_contexts');
