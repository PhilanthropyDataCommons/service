SELECT permission_grant_to_json(permission_grants.*) AS object
FROM permission_grants
WHERE
	id = :permissionGrantId
	AND can_manage_permission_grant(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		permission_grants.*::permission_grants
	);
