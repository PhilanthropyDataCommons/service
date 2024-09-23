SELECT organization_proposal_to_json(organizations_proposals.*) as "object"
FROM organizations_proposals
WHERE
  CASE
    WHEN :organizationId::integer IS NULL THEN
      true
    ELSE
      organization_id = :organizationId
    END
  AND CASE
    WHEN :proposalId::integer IS NULL THEN
      true
    ELSE
      proposal_id = :proposalId
    END
ORDER BY id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY;
