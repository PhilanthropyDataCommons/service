SELECT
	user_opportunity_permission_to_json(
		user_opportunity_permissions.*
	) AS object
FROM user_opportunity_permissions
WHERE
	user_keycloak_user_id = :userKeycloakUserId
	AND opportunity_id = :opportunityId
	AND opportunity_permission = :opportunityPermission
	AND NOT is_expired(not_after);
