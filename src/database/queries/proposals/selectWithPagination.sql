SELECT proposal_to_json(p.*) as "object"
FROM proposals p
  LEFT JOIN proposal_versions pv ON pv.proposal_id = p.id
  LEFT JOIN proposal_field_values pfv on pfv.proposal_version_id = pv.id
  LEFT JOIN changemakers_proposals op on op.proposal_id = p.id
WHERE
  CASE
    WHEN :createdBy::UUID IS NULL THEN
      true
    ELSE
      p.created_by = :createdBy
    END
  AND CASE
    WHEN (:search::text IS NULL
      OR :search = '') THEN
      true
    ELSE
      pfv.value_search @@ websearch_to_tsquery('english', :search::text)
    END
  AND CASE
    WHEN :changemakerId::integer IS NULL THEN
      true
    ELSE
      op.changemaker_id = :changemakerId
    END
  AND CASE
    WHEN :authContextKeycloakUserId::UUID IS NULL THEN
      true
    ELSE
      (
        p.created_by = :authContextKeycloakUserId
        OR :authContextIsAdministrator::boolean
      )
    END
GROUP BY p.id
ORDER BY p.id DESC
LIMIT :limit OFFSET :offset;
