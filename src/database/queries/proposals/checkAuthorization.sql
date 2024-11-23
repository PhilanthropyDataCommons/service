SELECT EXISTS (
  SELECT 1
    FROM proposals
    WHERE id = :id
      AND
        CASE
          WHEN :authContextKeycloakUserId::UUID IS NULL THEN
            TRUE
          ELSE
          (
            created_by = :authContextKeycloakUserId
            OR :authContextIsAdministrator::BOOLEAN
          )
          END
) AS result;
