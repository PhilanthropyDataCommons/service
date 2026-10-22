-- Materialize the listed users once (AS MATERIALIZED: PostgreSQL would
-- otherwise inline this single-use CTE and re-run the aggregation for
-- every conflicting row): the per-row enabled lookup below must not
-- rescan the whole payload for every conflicting row.
WITH listed_users AS MATERIALIZED (
	SELECT jsonb_object_agg(
		value ->> 'id',
		coalesce((value ->> 'enabled')::boolean, false)
	) AS enabled_by_id
	FROM jsonb_array_elements(:users::jsonb) AS value
)
INSERT INTO users (
	keycloak_user_id,
	keycloak_user_name,
	synced_from_keycloak_at
)
SELECT
	(value ->> 'id')::uuid,
	value ->> 'name',
	now()
FROM jsonb_array_elements(:users::jsonb) AS value
-- Both the sync and the JWT upsert insert users; ON CONFLICT keeps a first
-- request racing the sync from failing either path the way a MERGE would.
ON CONFLICT (keycloak_user_id) DO UPDATE SET
	-- Avoid removing an existing name.
	keycloak_user_name = coalesce(
		excluded.keycloak_user_name,
		users.keycloak_user_name
	),
	synced_from_keycloak_at = now(),
	disabled_at = CASE
		WHEN coalesce(
			(
				SELECT (enabled_by_id ->> users.keycloak_user_id::text)::boolean
				FROM listed_users
			),
			false
		) THEN NULL
		ELSE users.disabled_at
	END
RETURNING
	-- xmax stays 0 for a row this statement inserted and changes when the
	-- statement updated an existing row instead.
	xmax = 0 AS "wasInserted";
