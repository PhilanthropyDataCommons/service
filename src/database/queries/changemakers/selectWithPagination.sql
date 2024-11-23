SELECT DISTINCT o.id,
  changemaker_to_json(o.*, :keycloakUserId) AS object
FROM changemakers AS o
  LEFT JOIN changemakers_proposals AS op ON op.changemaker_id = o.id
WHERE
  CASE
    WHEN :proposalId::integer IS NULL THEN
      TRUE
    ELSE
      op.proposal_id = :proposalId
    END
ORDER BY o.id DESC
LIMIT :limit OFFSET :offset;
