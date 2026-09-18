DELETE FROM default_permission_grants
WHERE
	id = :defaultPermissionGrantId
RETURNING default_permission_grant_to_json(
	default_permission_grants
) AS object;
