SELECT source_to_json(sources.*) AS object
FROM sources
WHERE id = :id;
