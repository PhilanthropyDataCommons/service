SELECT changemaker_proposal_to_json(changemakers_proposals.*) AS object
FROM changemakers_proposals
WHERE
  CASE
    WHEN :changemakerId::integer IS NULL THEN
      TRUE
    ELSE
      changemaker_id = :changemakerId
    END
  AND CASE
    WHEN :proposalId::integer IS NULL THEN
      TRUE
    ELSE
      proposal_id = :proposalId
    END
ORDER BY id DESC
LIMIT :limit OFFSET :offset;
