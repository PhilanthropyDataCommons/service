SELECT organization_to_json(organizations) AS "object"
FROM organizations
WHERE employer_identification_number = :employerIdentificationNumber
