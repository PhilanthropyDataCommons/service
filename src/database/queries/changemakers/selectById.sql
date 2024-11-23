SELECT changemaker_to_json(changemakers.*, :keycloakUserId) AS object
FROM changemakers
WHERE id = :id;
