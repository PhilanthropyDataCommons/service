UPDATE organizations
SET
	disabled_at = :disabledAt::timestamptz,
	synced_from_keycloak_at = coalesce(
		:syncedFromKeycloakAt::timestamptz,
		organizations.synced_from_keycloak_at
	)
WHERE
	coalesce(
		organizations.synced_from_keycloak_at,
		'-infinity'::timestamptz
	) < :syncedBefore::timestamptz
	AND organizations.disabled_at IS NULL
RETURNING organizations.keycloak_organization_id;
