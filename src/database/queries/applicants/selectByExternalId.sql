SELECT id,
  external_id AS "externalId",
  opted_in AS "optedIn",
  created_at AS "createdAt"
FROM applicants
WHERE external_id = :externalId;
