UPDATE user_data_provider_permissions
SET not_after = now()
WHERE
	user_keycloak_user_id = :userKeycloakUserId
	AND permission = :permission::permission_t
	AND data_provider_short_code = :dataProviderShortCode
	AND NOT is_expired(not_after);
