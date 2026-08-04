SELECT initiative_to_json(initiatives.*) AS object
FROM initiatives
WHERE initiatives.id = :initiativeId;
