UPDATE user_group_changemaker_permissions
SET not_after = now()
WHERE
	keycloak_organization_id = :keycloakOrganizationId
	AND permission = :permission
	AND changemaker_id = :changemakerId
	AND NOT is_expired(not_after);
