WITH
	listed_users AS MATERIALIZED (
		SELECT
			jsonb_object_agg(
				value ->> 'id',
				coalesce((value ->> 'enabled')::boolean, false)
			) AS enabled_by_id
		FROM jsonb_array_elements(:users::jsonb) AS value
	)

INSERT INTO users (
	keycloak_user_id,
	keycloak_user_name,
	synced_from_keycloak_at,
	disabled_at
)
SELECT
	(value ->> 'id')::uuid AS "keycloakUserId",
	value ->> 'name' AS "keycloakUserName",
	:syncedFromKeycloakAt::timestamptz AS "syncedFromKeycloakAt",
	CASE
		WHEN coalesce((value ->> 'enabled')::boolean, false) THEN null
		ELSE :disabledAt::timestamptz
	END AS "disabledAt"
FROM jsonb_array_elements(:users::jsonb) AS value
ON CONFLICT (keycloak_user_id) DO UPDATE
	SET
		keycloak_user_name = coalesce(
			excluded.keycloak_user_name,
			users.keycloak_user_name
		),
		synced_from_keycloak_at = coalesce(
			:syncedFromKeycloakAt::timestamptz,
			users.synced_from_keycloak_at
		),
		disabled_at = CASE
			WHEN coalesce((
				SELECT (enabled_by_id ->> users.keycloak_user_id::text)::boolean
				FROM listed_users
			), false) THEN null
			ELSE coalesce(:disabledAt::timestamptz, users.disabled_at)
		END
RETURNING
	xmax = 0 AS "wasInserted";
