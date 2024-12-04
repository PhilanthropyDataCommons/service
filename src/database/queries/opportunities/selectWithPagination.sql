SELECT opportunity_to_json(opportunities.*) AS object
FROM opportunities
ORDER BY id
LIMIT :limit
OFFSET :offset;
