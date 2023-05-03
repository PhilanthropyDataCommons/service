SELECT p.id AS "id",
  p.applicant_id AS "applicantId",
  p.external_id AS "externalId",
  p.opportunity_id AS "opportunityId",
  p.created_at AS "createdAt"
FROM proposals p
  LEFT JOIN proposal_versions pv ON pv.proposal_id = p.id
  LEFT JOIN proposal_field_values pfv on pfv.proposal_version_id = pv.id
WHERE
  CASE
    WHEN :search::text != '' THEN
      pfv.value_search @@ websearch_to_tsquery(:search::text)
    ELSE
      true
    END
GROUP BY p.id
ORDER BY p.id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY
