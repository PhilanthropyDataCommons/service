SELECT funder_to_json(funders.*) AS object
FROM funders
WHERE short_code = :shortCode;
