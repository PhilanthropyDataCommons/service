SELECT sync_basefield_to_json(sync_basefields.*) as "object"
FROM sync_basefields
WHERE id = :id;
