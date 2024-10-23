INSERT INTO sync_basefields (
  status,
  status_updated_at,
  synchronization_url,
  created_by
)
VALUES (
  :status,
  :statusUpdatedAt,
  :synchronizationUrl,
  :createdBy
)
RETURNING sync_basefield_to_json(sync_basefields) AS "object";
