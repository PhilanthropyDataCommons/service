INSERT INTO users (
  authentication_id,
  source_id
)
VALUES (
  :authenticationId,
  :sourceId
)
RETURNING user_to_json(users) AS "object";
