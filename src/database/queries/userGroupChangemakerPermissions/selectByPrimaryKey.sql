SELECT
	user_group_changemaker_permission_to_json(
		user_group_changemaker_permissions.*
	) AS object
FROM user_group_changemaker_permissions
WHERE
	keycloak_organization_id = :keycloakOrganizationId
	AND changemaker_id = :changemakerId
	AND permission = :permission
	AND NOT is_expired(not_after);
