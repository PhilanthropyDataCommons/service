UPDATE organization_changemaker_permissions
SET not_after = now()
WHERE
	organization_keycloak_id = :organizationKeycloakId
	AND permission = :permission::permission_t
	AND changemaker_id = :changemakerId
	AND NOT is_expired(not_after);
