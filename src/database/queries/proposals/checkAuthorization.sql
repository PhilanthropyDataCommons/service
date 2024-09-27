SELECT EXISTS (
  SELECT 1
    FROM proposals
    WHERE id = :id
      AND
        CASE
          WHEN :userId::integer IS NULL THEN
            true
          ELSE
          (
            created_by = :userId
            OR :isAdministrator::boolean
          )
          END
) AS result
