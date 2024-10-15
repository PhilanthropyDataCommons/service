SELECT changemaker_proposal_to_json(changemakers_proposals.*) as "object"
FROM changemakers_proposals
WHERE
  CASE
    WHEN :changemakerId::integer IS NULL THEN
      true
    ELSE
      changemaker_id = :changemakerId
    END
  AND CASE
    WHEN :proposalId::integer IS NULL THEN
      true
    ELSE
      proposal_id = :proposalId
    END
ORDER BY id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY;
