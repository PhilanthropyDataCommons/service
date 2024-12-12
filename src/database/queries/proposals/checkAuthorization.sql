SELECT EXISTS(
  SELECT 1
    FROM proposals
    WHERE id = :id
      AND
        CASE
          WHEN :authContextKeycloakUserId::uuid IS NULL THEN
            TRUE
          ELSE
          (
            created_by = :authContextKeycloakUserId
            OR :authContextIsAdministrator::boolean
          )
          END
) AS result;
