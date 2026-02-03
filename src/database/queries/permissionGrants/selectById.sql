SELECT permission_grant_to_json(permission_grants.*) AS object
FROM permission_grants
WHERE id = :permissionGrantId;
