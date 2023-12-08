WITH ins AS (
   INSERT INTO applicants (external_id) VALUES (:externalId)
   ON CONFLICT (external_id) DO NOTHING
   RETURNING id, external_id, opted_in, created_at
)
SELECT
  id as "id",
  external_id as "externalId",
  opted_in AS "optedIn",
  created_at AS "createdAt"
FROM ins
UNION ALL
SELECT
  id as "id",
  external_id as "externalId",
  opted_in AS "optedIn",
  created_at AS "createdAt"
FROM applicants
WHERE external_id = :externalId;
