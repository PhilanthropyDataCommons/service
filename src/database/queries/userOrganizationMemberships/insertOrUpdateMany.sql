INSERT INTO user_organization_memberships (
	organization_keycloak_id,
	user_keycloak_user_id,
	synced_from_keycloak_at,
	disabled_at
)
SELECT
	(value ->> 'organizationKeycloakId')::uuid
		AS "organizationKeycloakId",
	(value ->> 'userKeycloakUserId')::uuid AS "userKeycloakUserId",
	:syncedFromKeycloakAt::timestamptz AS "syncedFromKeycloakAt",
	null AS "disabledAt"
FROM jsonb_array_elements(:memberships::jsonb) AS value
ON CONFLICT (organization_keycloak_id, user_keycloak_user_id) DO UPDATE
	SET
		synced_from_keycloak_at = coalesce(
			:syncedFromKeycloakAt::timestamptz,
			user_organization_memberships.synced_from_keycloak_at
		),
		disabled_at = null
RETURNING
	user_keycloak_user_id,
	xmax = 0 AS "wasInserted";
