SELECT EXISTS (
  SELECT 1
    FROM proposals
    WHERE id = :id
      AND
        CASE
          WHEN :userId != 0 THEN
          (
            created_by = :userId
            OR :isAdministrator
          )
          ELSE
            true
          END
) AS result
