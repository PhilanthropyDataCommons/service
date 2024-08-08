SELECT source_to_json(sources.*) AS "object"
FROM sources
ORDER BY sources.id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY
