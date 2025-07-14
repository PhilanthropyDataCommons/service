UPDATE user_opportunity_permissions
SET not_after = now()
WHERE
	user_keycloak_user_id = :userKeycloakUserId
	AND opportunity_permission = :opportunityPermission::opportunity_permission_t
	AND opportunity_id = :opportunityId
	AND NOT is_expired(not_after)
RETURNING
	user_opportunity_permission_to_json(user_opportunity_permissions) AS object;
