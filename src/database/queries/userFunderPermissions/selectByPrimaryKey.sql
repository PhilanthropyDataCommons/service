SELECT
	user_funder_permission_to_json(
		user_funder_permissions.*
	) AS object
FROM user_funder_permissions
WHERE
	user_keycloak_user_id = :userKeycloakUserId
	AND funder_short_code = :funderShortCode
	AND permission = :permission
	AND NOT is_expired(not_after);
