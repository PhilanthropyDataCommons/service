SELECT permission_grant_to_json(permission_grants.*) AS object
FROM permission_grants
ORDER BY permission_grants.id DESC
LIMIT :limit OFFSET :offset;
