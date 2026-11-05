UPDATE user_organization_memberships
SET
	disabled_at = clock_timestamp(),
	synced_from_keycloak_at = coalesce(
		:syncedFromKeycloakAt::timestamptz,
		user_organization_memberships.synced_from_keycloak_at
	)
WHERE
	organization_keycloak_id = :organizationKeycloakId::uuid
	AND coalesce(
		user_organization_memberships.synced_from_keycloak_at,
		'-infinity'::timestamptz
	) < :syncStartedAt::timestamptz
	AND user_organization_memberships.disabled_at IS NULL
RETURNING user_organization_memberships.user_keycloak_user_id;
