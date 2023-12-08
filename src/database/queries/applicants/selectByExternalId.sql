SELECT
  id AS "id",
  external_id as "externalId",
  opted_in AS "optedIn",
  created_at AS "createdAt"
FROM applicants
WHERE external_id = :externalId

