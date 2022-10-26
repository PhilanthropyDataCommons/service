SELECT af.id AS "id",
  af.opportunity_id as "opportunityId",
  af.version AS "version",
  af.created_at AS "createdAt"
FROM application_forms af
WHERE af.id = :id;

