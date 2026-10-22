INSERT INTO users (
	keycloak_user_id,
	keycloak_user_name
) VALUES (
	:keycloakUserId::uuid,
	:keycloakUserName::varchar
)
-- Both the JWT upsert and the sync insert users; ON CONFLICT keeps a first
-- request racing the sync from failing either path the way a MERGE would.
ON CONFLICT (keycloak_user_id) DO UPDATE SET
	keycloak_user_name = excluded.keycloak_user_name,
	-- The token proves the account was live when issued: clear a prior
	-- disable only when the disable predates the token. Same-second ordering
	-- is unknowable, so preserve; the caller's next request corrects it.
	disabled_at = CASE
		WHEN users.disabled_at < :jwtIssuedAt::timestamptz THEN NULL
		ELSE users.disabled_at
	END
RETURNING
	user_to_json(users.*) AS object,
	-- xmax stays 0 for a row this statement inserted and changes when the
	-- statement updated an existing row instead.
	xmax = 0 AS "wasInserted";
