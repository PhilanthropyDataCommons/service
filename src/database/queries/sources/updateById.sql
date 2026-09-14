UPDATE sources
SET label = update_if(:labelWasProvided, :label, label)
WHERE id = :sourceId
RETURNING source_to_json(
	sources,
	:authContextKeycloakUserId,
	:authContextIsAdministrator
) AS object;
