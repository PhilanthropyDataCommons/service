SELECT exists(
	SELECT 1
	FROM user_data_provider_permissions
	WHERE
		user_keycloak_user_id = :userKeycloakUserId
		AND data_provider_short_code = :dataProviderShortCode
		AND permission = :permission
		AND NOT is_expired(not_after)
) AS result;
