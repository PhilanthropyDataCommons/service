SELECT exists(
	SELECT 1
	FROM permission_grants
	WHERE
		id = :permissionGrantId
		AND can_manage_permission_grant(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			permission_grants.*::permission_grants
		)
) AS result;
