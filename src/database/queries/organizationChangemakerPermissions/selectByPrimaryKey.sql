SELECT
	organization_changemaker_permission_to_json(
		organization_changemaker_permissions.*
	) AS object
FROM organization_changemaker_permissions
WHERE
	organization_keycloak_id = :organizationKeycloakId
	AND changemaker_id = :changemakerId
	AND permission = :permission
	AND NOT is_expired(not_after);
