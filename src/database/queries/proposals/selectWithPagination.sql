SELECT proposal_to_json(p.*) AS object
FROM proposals AS p
  LEFT JOIN proposal_versions AS pv ON pv.proposal_id = p.id
  LEFT JOIN proposal_field_values AS pfv ON pfv.proposal_version_id = pv.id
  LEFT JOIN changemakers_proposals AS op ON op.proposal_id = p.id
WHERE
  CASE
    WHEN :createdBy::UUID IS NULL THEN
      TRUE
    ELSE
      p.created_by = :createdBy
    END
  AND CASE
    WHEN (:search::TEXT IS NULL
      OR :search = '') THEN
      TRUE
    ELSE
      pfv.value_search @@ websearch_to_tsquery('english', :search::TEXT)
    END
  AND CASE
    WHEN :changemakerId::INTEGER IS NULL THEN
      TRUE
    ELSE
      op.changemaker_id = :changemakerId
    END
  AND CASE
    WHEN :authContextKeycloakUserId::UUID IS NULL THEN
      TRUE
    ELSE
      (
        p.created_by = :authContextKeycloakUserId
        OR :authContextIsAdministrator::BOOLEAN
      )
    END
GROUP BY p.id
ORDER BY p.id DESC
LIMIT :limit OFFSET :offset;
