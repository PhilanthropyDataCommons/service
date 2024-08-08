INSERT INTO funders (
  name
) VALUES (
  :name
)
RETURNING funder_to_json(funders) AS "object";
