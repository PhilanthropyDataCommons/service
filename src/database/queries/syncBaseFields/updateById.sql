UPDATE sync_basefields
SET
  status_updated_at = COALESCE(:statusUpdatedAt, status_updated_at),
  status = COALESCE(:status, status)
WHERE id = :id
RETURNING sync_basefield_to_json(sync_basefields) AS "object";

