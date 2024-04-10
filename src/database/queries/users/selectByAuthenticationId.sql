SELECT user_to_json(users.*) as "object"
FROM users
WHERE authentication_id = :authenticationId
