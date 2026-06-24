SELECT permission_grant_to_json(permission_grants.*) AS object
FROM permission_grants
	INNER JOIN
		permitted_permission_grant_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator
		) AS permitted_grants
		ON permission_grants.id = permitted_grants.id
WHERE permission_grants.id = :permissionGrantId;
