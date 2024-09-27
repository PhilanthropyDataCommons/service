SELECT DISTINCT o.id,
  organization_to_json(o.*, :authenticationId) AS "object"
FROM organizations o
  LEFT JOIN organizations_proposals op on op.organization_id = o.id
WHERE
  CASE
    WHEN :proposalId::integer IS NULL THEN
      true
    ELSE
      op.proposal_id = :proposalId
    END
ORDER BY o.id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY
