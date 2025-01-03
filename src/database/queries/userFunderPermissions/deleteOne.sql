UPDATE user_funder_permissions
SET not_after = now()
WHERE
	user_keycloak_user_id = :userKeycloakUserId
	AND permission = :permission::permission_t
	AND funder_short_code = :funderShortCode
	AND NOT is_expired(not_after);
