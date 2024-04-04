INSERT INTO users (
  authentication_id
)
VALUES (
  :authenticationId
)
RETURNING user_to_json(users) AS "object";
