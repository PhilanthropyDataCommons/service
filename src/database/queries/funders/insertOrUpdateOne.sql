INSERT INTO funders (
  short_code,
  name
) VALUES (
  :shortCode,
  :name
)
ON CONFLICT (short_code)
DO UPDATE SET
  name = excluded.name
RETURNING funder_to_json(funders) AS object;
