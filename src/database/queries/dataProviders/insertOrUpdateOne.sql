INSERT INTO data_providers (
  short_code,
  name
) VALUES (
  :shortCode,
  :name
)
ON CONFLICT (short_code)
DO UPDATE SET
  name = excluded.name
RETURNING data_provider_to_json(data_providers) AS object;
