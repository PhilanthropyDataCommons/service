SELECT source_to_json(sources.*) AS "object"
FROM sources
WHERE id = select_system_source_id()
