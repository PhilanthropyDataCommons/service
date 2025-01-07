SELECT changemaker_to_json(changemakers.*, :authContextKeycloakUserId) AS object
FROM changemakers
WHERE id = :changemakerId;
