INSERT INTO organizations (
  tax_id,
  name
) VALUES (
  :taxId,
  :name
)
RETURNING organization_to_json(organizations) AS "object";
