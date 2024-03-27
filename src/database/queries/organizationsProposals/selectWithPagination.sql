SELECT organization_proposal_to_json(organizations_proposals.*) as "object"
FROM organizations_proposals
WHERE
  CASE
    WHEN :organizationId != 0 THEN
      organization_id = :organizationId
    ELSE
      true
    END
  AND CASE
    WHEN :proposalId != 0 THEN
      proposal_id = :proposalId
    ELSE
      true
    END
ORDER BY id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY;
