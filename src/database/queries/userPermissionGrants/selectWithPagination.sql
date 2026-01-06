SELECT
	user_permission_grant_to_json(
		user_permission_grants.*
	) AS object
FROM user_permission_grants
WHERE
	user_keycloak_user_id = :userKeycloakUserId
	AND NOT is_expired(not_after)
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
