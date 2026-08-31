SELECT default_permission_grant_to_json(default_permission_grants.*) AS object
FROM default_permission_grants
WHERE default_permission_grants.id = :defaultPermissionGrantId;
