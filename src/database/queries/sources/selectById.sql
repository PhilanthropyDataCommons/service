SELECT
	source_to_json(
		sources.*,
		:authContextId,
		:authContextIsAdministrator
	) AS object
FROM sources
	INNER JOIN
		permitted_source_ids(
			:authContextId,
			:authContextIsAdministrator,
			'view',
			'source'
		) AS permitted_sources
		ON sources.id = permitted_sources.id
WHERE sources.id = :sourceId;
