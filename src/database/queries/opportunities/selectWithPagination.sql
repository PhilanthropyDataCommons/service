SELECT opportunity_to_json(opportunities.*) AS "object"
FROM opportunities
ORDER BY id
LIMIT
  CASE WHEN :limit != 0 THEN
    :limit
  ELSE
    NULL
  END
OFFSET :offset

