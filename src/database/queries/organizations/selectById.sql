SELECT organization_to_json(organizations.*, :keycloakUserId) AS "object"
FROM organizations
WHERE id = :id
