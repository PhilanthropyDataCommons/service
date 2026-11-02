WITH
	listed_organizations AS MATERIALIZED (
		SELECT
			jsonb_object_agg(
				value ->> 'id',
				coalesce((value ->> 'enabled')::boolean, false)
			) AS enabled_by_id
		FROM jsonb_array_elements(:organizations::jsonb) AS value
	)

INSERT INTO organizations (
	keycloak_organization_id,
	keycloak_organization_name,
	synced_from_keycloak_at,
	disabled_at
)
SELECT
	(value ->> 'id')::uuid AS "keycloakOrganizationId",
	value ->> 'name' AS "keycloakOrganizationName",
	:syncedFromKeycloakAt::timestamptz AS "syncedFromKeycloakAt",
	CASE
		WHEN coalesce((value ->> 'enabled')::boolean, false) THEN null
		ELSE :disabledAt::timestamptz
	END AS "disabledAt"
FROM jsonb_array_elements(:organizations::jsonb) AS value
ON CONFLICT (keycloak_organization_id) DO UPDATE
	SET
		keycloak_organization_name = coalesce(
			excluded.keycloak_organization_name,
			organizations.keycloak_organization_name
		),
		synced_from_keycloak_at = coalesce(
			:syncedFromKeycloakAt::timestamptz,
			organizations.synced_from_keycloak_at
		),
		disabled_at = CASE
			WHEN coalesce((
				SELECT (
					enabled_by_id
					->> organizations.keycloak_organization_id::text
				)::boolean
				FROM listed_organizations
			), false) THEN null
			ELSE coalesce(:disabledAt::timestamptz, organizations.disabled_at)
		END
RETURNING
	keycloak_organization_id,
	xmax = 0 AS "wasInserted";
