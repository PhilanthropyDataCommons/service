SELECT funder_to_json(funders.*) AS "object"
FROM funders
ORDER BY funders.created_at DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY
