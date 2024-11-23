SELECT funder_to_json(funders.*) AS "object"
FROM funders
ORDER BY funders.created_at DESC
LIMIT :limit OFFSET :offset
