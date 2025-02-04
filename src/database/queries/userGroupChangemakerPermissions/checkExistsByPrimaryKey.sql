SELECT exists(
	SELECT 1
	FROM user_group_changemaker_permissions
	WHERE
		keycloak_organization_id = :keycloakOrganizationId
		AND changemaker_id = :changemakerId
		AND permission = :permission
		AND NOT is_expired(not_after)
) AS result;
