INSERT INTO users (
	keycloak_user_id,
	keycloak_user_name,
	synced_from_keycloak_at
) VALUES (
	:keycloakUserId::uuid,
	:keycloakUserName::varchar,
	:syncedFromKeycloakAt::timestamptz
)
-- Two writers may insert the same user at once; ON CONFLICT upserts
-- instead of failing the way a MERGE would.
ON CONFLICT (keycloak_user_id) DO UPDATE SET
	keycloak_user_name = excluded.keycloak_user_name,
	-- A disable older than the known-live time clears: the account was
	-- seen live after that disable. Same-second ordering is unknowable,
	-- so preserve; a later known-live time corrects it.
	disabled_at = CASE
		WHEN users.disabled_at < :knownLiveAt::timestamptz THEN NULL
		ELSE users.disabled_at
	END,
	synced_from_keycloak_at = coalesce(
		:syncedFromKeycloakAt::timestamptz,
		users.synced_from_keycloak_at
	)
RETURNING
	user_to_json(users.*) AS object,
	-- xmax stays 0 for a row this statement inserted and changes when the
	-- statement updated an existing row instead.
	xmax = 0 AS "wasInserted";
