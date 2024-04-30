INSERT INTO organizations (
  employer_identification_number,
  name
) VALUES (
  :employerIdentificationNumber,
  :name
)
RETURNING organization_to_json(organizations) AS "object";
