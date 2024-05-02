SELECT organization_to_json(organizations) AS "object"
FROM organizations
WHERE tax_id = :taxId
