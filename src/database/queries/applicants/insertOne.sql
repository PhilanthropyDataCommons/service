INSERT INTO applicants (
  external_id,
  opted_in
)
VALUES (
  :externalId,
  :optedIn
)
RETURNING
  id as "id",
  external_id as "externalId",
  opted_in AS "optedIn",
  created_at AS "createdAt"
