INSERT INTO organizations (
  employer_identification_number,
  name
) VALUES (
  :employerIdentificationNumber,
  :name
)
RETURNING
  id as "id",
  employer_identification_number AS "employerIdentificationNumber",
  name AS "name",
  created_at AS "createdAt"
