DELETE FROM sources
WHERE
	id = :sourceId
RETURNING source_to_json(sources) AS object;
