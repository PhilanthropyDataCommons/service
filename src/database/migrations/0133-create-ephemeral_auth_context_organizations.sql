CREATE TABLE ephemeral_auth_context_organizations (
	auth_context_id text NOT NULL
	REFERENCES ephemeral_auth_contexts (token_id) ON DELETE CASCADE,
	keycloak_organization_id uuid NOT NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	PRIMARY KEY (auth_context_id, keycloak_organization_id)
);

COMMENT ON TABLE ephemeral_auth_context_organizations IS
'The organizations an ephemeral auth context''s token lists, which are the '
'user groups the user is acting as when using that token.';

SELECT audit_table('ephemeral_auth_context_organizations');
