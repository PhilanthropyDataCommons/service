SELECT proposal_to_json(p.*) AS object
FROM proposals AS p
  LEFT JOIN proposal_versions AS pv ON p.id = pv.proposal_id
  LEFT JOIN proposal_field_values AS pfv ON pv.id = pfv.proposal_version_id
  LEFT JOIN changemakers_proposals AS op ON p.id = op.proposal_id
WHERE
  CASE
    WHEN :createdBy::uuid IS NULL THEN
      TRUE
    ELSE
      p.created_by = :createdBy
    END
  AND CASE
    WHEN (:search::text IS NULL
      OR :search = '') THEN
      TRUE
    ELSE
      pfv.value_search @@ websearch_to_tsquery('english', :search::text)
    END
  AND CASE
    WHEN :changemakerId::integer IS NULL THEN
      TRUE
    ELSE
      op.changemaker_id = :changemakerId
    END
  AND CASE
    WHEN :authContextKeycloakUserId::uuid IS NULL THEN
      TRUE
    ELSE
      (
        p.created_by = :authContextKeycloakUserId
        OR :authContextIsAdministrator::boolean
      )
    END
GROUP BY p.id
ORDER BY p.id DESC
LIMIT :limit OFFSET :offset;
