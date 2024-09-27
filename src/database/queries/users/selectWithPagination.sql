SELECT user_to_json(users.*) as "object"
FROM users
WHERE
  CASE
    WHEN :authenticationId::text IS NULL THEN
      true
    ELSE
      (authentication_id = :authenticationId)
    END
  AND CASE
    WHEN :userId::integer IS NULL THEN
      true
    ELSE
      (
        id = :userId
        OR :isAdministrator::boolean
      )
    END
GROUP BY id
ORDER BY id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY;
