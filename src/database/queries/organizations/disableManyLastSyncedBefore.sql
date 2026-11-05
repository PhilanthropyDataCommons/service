UPDATE organizations
SET
	disabled_at = clock_timestamp(),
	synced_from_keycloak_at = coalesce(
		:syncedFromKeycloakAt::timestamptz,
		organizations.synced_from_keycloak_at
	)
WHERE
	coalesce(
		organizations.synced_from_keycloak_at,
		'-infinity'::timestamptz
	) < :syncStartedAt::timestamptz
	AND organizations.disabled_at IS NULL
RETURNING organizations.keycloak_organization_id;
