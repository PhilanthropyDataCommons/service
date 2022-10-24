SELECT p.id AS "id",
  p.applicant_id AS "applicantId",
  p.external_id AS "externalId",
  p.opportunity_id AS "opportunityId",
  p.created_at AS "createdAt"
FROM proposals p;
