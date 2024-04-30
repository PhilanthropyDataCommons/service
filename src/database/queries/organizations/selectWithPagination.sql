SELECT DISTINCT o.id,
  organization_to_json(o.*) AS "object"
FROM organizations o
  LEFT JOIN organizations_proposals op on op.organization_id = o.id
WHERE
  CASE
    WHEN :proposalId != 0 THEN
      op.proposal_id = :proposalId
    ELSE
      true
    END
ORDER BY o.id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY
