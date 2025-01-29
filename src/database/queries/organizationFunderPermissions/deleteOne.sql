UPDATE organization_funder_permissions
SET not_after = now()
WHERE
	organization_keycloak_id = :organizationKeycloakId
	AND permission = :permission::permission_t
	AND funder_short_code = :funderShortCode
	AND NOT is_expired(not_after);
