SELECT p.id AS "id",
  p.applicant_id AS "applicantId",
  p.external_id AS "externalId",
  p.opportunity_id AS "opportunityId",
  p.created_at AS "createdAt"
FROM proposals p
ORDER BY p.id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY
