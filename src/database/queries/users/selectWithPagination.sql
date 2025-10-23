SELECT
	user_to_json(
		users.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM users
WHERE
	CASE
		WHEN :keycloakUserId::uuid IS NULL THEN
			TRUE
		ELSE
			keycloak_user_id = :keycloakUserId
	END
	AND CASE
		WHEN :authContextKeycloakUserId::uuid IS NULL THEN
			TRUE
		ELSE
			(
				keycloak_user_id = :authContextKeycloakUserId
				OR :authContextIsAdministrator::boolean
			)
	END
GROUP BY keycloak_user_id
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
