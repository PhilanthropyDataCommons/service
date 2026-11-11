CREATE TABLE organizations (
	keycloak_organization_id uuid PRIMARY KEY,
	keycloak_organization_name text,
	synced_from_keycloak_at timestamp with time zone,
	disabled_at timestamp with time zone,
	created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE organizations IS
'Cached replica of Keycloak organization identity, populated by sync.';

COMMENT ON COLUMN organizations.keycloak_organization_id IS
'The Keycloak-assigned UUID of the organization.';

COMMENT ON COLUMN organizations.keycloak_organization_name IS
'The organization name as reported by Keycloak; null until first sync.';

COMMENT ON COLUMN organizations.synced_from_keycloak_at IS
'Last time this row was confirmed against Keycloak by a sync; null until '
'first sync.';

COMMENT ON COLUMN organizations.disabled_at IS
'Time this organization was observed as absent or not enabled in Keycloak '
'by a sync; null if still live.';

SELECT audit_table('organizations');
