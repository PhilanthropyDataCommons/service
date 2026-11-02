ALTER TABLE users
ADD COLUMN synced_from_keycloak_at timestamp with time zone,
ADD COLUMN disabled_at timestamp with time zone;

COMMENT ON COLUMN users.synced_from_keycloak_at IS
'Last time this row was confirmed against Keycloak by a sync; null until '
'first sync.';

COMMENT ON COLUMN users.disabled_at IS
'Time this user was observed as absent or not enabled in Keycloak by a '
'sync; null if still live.';
