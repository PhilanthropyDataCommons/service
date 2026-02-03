DELETE FROM permission_grants
WHERE
	id = :permissionGrantId
RETURNING permission_grant_to_json(permission_grants) AS object;
