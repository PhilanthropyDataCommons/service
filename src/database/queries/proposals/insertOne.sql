INSERT INTO proposals (
  applicant_id,
  external_id,
  opportunity_id
) VALUES (
  :applicantId,
  :externalId,
  :opportunityId
)
RETURNING
  id as "id",
  applicant_id AS "applicantId",
  external_id AS "externalId",
  opportunity_id AS "opportunityId",
  created_at AS "createdAt"
