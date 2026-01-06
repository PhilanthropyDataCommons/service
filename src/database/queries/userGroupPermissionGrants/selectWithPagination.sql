SELECT
	user_group_permission_grant_to_json(
		user_group_permission_grants.*
	) AS object
FROM user_group_permission_grants
WHERE
	keycloak_organization_id = :keycloakOrganizationId
	AND NOT is_expired(not_after)
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
