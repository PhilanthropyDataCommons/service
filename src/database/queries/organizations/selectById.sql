SELECT organization_to_json(organizations.*, :authenticationId) AS "object"
FROM organizations
WHERE id = :id
