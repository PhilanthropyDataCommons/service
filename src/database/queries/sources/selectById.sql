SELECT
	source_to_json(
		sources.*,
		:authContextKeycloakUserId,
		:authContextIsAdministrator
	) AS object
FROM sources
	INNER JOIN
		permitted_source_ids(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			'view',
			'source'
		) AS permitted_sources
		ON sources.id = permitted_sources.id
WHERE sources.id = :sourceId;
