SELECT
	source_to_json(
		sources.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM sources
WHERE
	id = :sourceId
	AND has_source_permission(
		:authContextKeycloakUserId,
		:authContextIsAdministrator,
		sources.id,
		'view',
		'source'
	);
