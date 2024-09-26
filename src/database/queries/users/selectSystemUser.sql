SELECT user_to_json(users.*) AS "object"
FROM users
WHERE id = system_user_id()
