INSERT INTO proposals (
  external_id,
  opportunity_id
) VALUES (
  :externalId,
  :opportunityId
)
RETURNING
  id as "id",
  external_id AS "externalId",
  opportunity_id AS "opportunityId",
  created_at AS "createdAt"
