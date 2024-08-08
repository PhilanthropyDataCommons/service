SELECT DISTINCT funders.id,
  funder_to_json(funders.*) AS "object"
FROM funders
ORDER BY funders.id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY
