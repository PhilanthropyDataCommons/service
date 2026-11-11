CREATE TABLE user_organization_memberships (
	organization_keycloak_id uuid NOT NULL
	REFERENCES organizations (keycloak_organization_id) ON DELETE CASCADE,
	user_keycloak_user_id uuid NOT NULL REFERENCES users (keycloak_user_id)
	ON DELETE CASCADE,
	synced_from_keycloak_at timestamp with time zone,
	disabled_at timestamp with time zone,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	PRIMARY KEY (organization_keycloak_id, user_keycloak_user_id)
);

COMMENT ON TABLE user_organization_memberships IS
'Cached replica of Keycloak organization memberships, populated by sync.';

COMMENT ON COLUMN user_organization_memberships.synced_from_keycloak_at IS
'Last time this row was confirmed against Keycloak by a sync; null until '
'first sync.';

COMMENT ON COLUMN user_organization_memberships.disabled_at IS
'Time this membership was observed as absent in Keycloak by a sync; null '
'if still live.';

SELECT audit_table('user_organization_memberships');
