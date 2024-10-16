SELECT DISTINCT o.id,
  changemaker_to_json(o.*, :keycloakUserId) AS "object"
FROM changemakers o
  LEFT JOIN changemakers_proposals op on op.changemaker_id = o.id
WHERE
  CASE
    WHEN :proposalId::integer IS NULL THEN
      true
    ELSE
      op.proposal_id = :proposalId
    END
ORDER BY o.id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY
