SELECT exists(
	SELECT 1
	FROM organization_changemaker_permissions
	WHERE
		organization_keycloak_id = :organizationKeycloakId
		AND changemaker_id = :changemakerId
		AND permission = :permission
		AND NOT is_expired(not_after)
) AS result;
