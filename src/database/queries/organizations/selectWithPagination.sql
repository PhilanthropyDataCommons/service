SELECT id AS "id",
  employer_identification_number AS "employerIdentificationNumber",
  name AS "name",
  created_at AS "createdAt"
FROM organizations
ORDER BY id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY
