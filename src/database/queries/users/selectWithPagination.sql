SELECT user_to_json(users.*) as "object"
FROM users
WHERE
  CASE
    WHEN :authenticationId != '' THEN
      authentication_id = :authenticationId
    ELSE
      true
    END
  AND CASE
    WHEN :userId != 0 THEN
      (
        id = :userId
        OR :isAdministrator
      )
    ELSE
      true
    END
GROUP BY id
ORDER BY id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY;
