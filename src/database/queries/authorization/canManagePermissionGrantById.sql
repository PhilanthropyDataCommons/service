SELECT exists(
	SELECT 1
	FROM
		permitted_permission_grant_ids(
			:authContextId,
			:authContextIsAdministrator
		) AS permitted_grants
	WHERE permitted_grants.id = :permissionGrantId
) AS result;
