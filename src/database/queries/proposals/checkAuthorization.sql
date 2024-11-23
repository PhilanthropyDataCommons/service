SELECT EXISTS (
  SELECT 1
    FROM proposals
    WHERE id = :id
      AND
        CASE
          WHEN :authContextKeycloakUserId::UUID IS NULL THEN
            true
          ELSE
          (
            created_by = :authContextKeycloakUserId
            OR :authContextIsAdministrator::boolean
          )
          END
) AS result;
