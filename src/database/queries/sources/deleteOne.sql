DELETE FROM sources
WHERE
	id = :sourceId
RETURNING source_to_json(
	sources,
	:authContextKeycloakUserId,
	:authContextIsAdministrator
) AS object;
