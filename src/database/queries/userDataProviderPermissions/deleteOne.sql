UPDATE user_data_provider_permissions
SET not_after = now()
WHERE
	user_keycloak_user_id = :userKeycloakUserId
	AND permission = :permission::permission_t
	AND data_provider_short_code = :dataProviderShortCode
	AND NOT is_expired(not_after)
RETURNING
	user_data_provider_permission_to_json(user_data_provider_permissions)
		AS object;
