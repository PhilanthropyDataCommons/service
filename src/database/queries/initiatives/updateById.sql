UPDATE initiatives
SET title = update_if(:titleWasProvided, :title, title)
WHERE id = :initiativeId
RETURNING initiative_to_json(initiatives) AS object;
