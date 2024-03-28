SELECT af.id AS "id",
  af.opportunity_id as "opportunityId",
  af.version AS "version",
  af.created_at AS "createdAt"
FROM application_forms af
ORDER BY af.id
LIMIT
  CASE WHEN :limit != 0 THEN
    :limit
  ELSE
    NULL
  END
OFFSET :offset
