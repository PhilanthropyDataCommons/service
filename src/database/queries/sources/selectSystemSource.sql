SELECT
	source_to_json(
		sources.*,
		:authContextId,
		:authContextIsAdministrator
	) AS object
FROM sources
WHERE id = system_source_id();
