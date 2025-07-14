INSERT INTO user_opportunity_permissions (
	user_keycloak_user_id,
	opportunity_permission,
	opportunity_id,
	created_by,
	not_after
) VALUES (
	:userKeycloakUserId,
	:opportunityPermission::opportunity_permission_t,
	:opportunityId,
	:authContextKeycloakUserId,
	NULL
)
ON CONFLICT (
	user_keycloak_user_id, opportunity_permission, opportunity_id
) DO UPDATE
	SET not_after = NULL
RETURNING
	user_opportunity_permission_to_json(user_opportunity_permissions) AS object;
