SELECT
	source_to_json(
		sources.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM sources
ORDER BY id DESC
LIMIT :limit OFFSET :offset;
