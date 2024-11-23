SELECT changemaker_to_json(changemakers) AS object
FROM changemakers
WHERE tax_id = :taxId;
