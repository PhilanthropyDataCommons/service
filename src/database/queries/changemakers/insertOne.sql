INSERT INTO changemakers (
  tax_id,
  name
) VALUES (
  :taxId,
  :name
)
RETURNING changemaker_to_json(changemakers) AS object;
