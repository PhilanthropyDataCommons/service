SELECT
	source_to_json(
		sources.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM sources
WHERE id = :sourceId;
