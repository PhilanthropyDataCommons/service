UPDATE user_organization_memberships
SET
	disabled_at = :disabledAt::timestamptz,
	synced_from_keycloak_at = coalesce(
		:syncedFromKeycloakAt::timestamptz,
		user_organization_memberships.synced_from_keycloak_at
	)
WHERE
	coalesce(
		user_organization_memberships.synced_from_keycloak_at,
		'-infinity'::timestamptz
	) < :syncedBefore::timestamptz
	AND user_organization_memberships.disabled_at IS NULL
	AND (
		:organizationKeycloakId::uuid IS NULL
		OR user_organization_memberships.organization_keycloak_id
		= :organizationKeycloakId::uuid
	)
RETURNING user_organization_memberships.user_keycloak_user_id;
