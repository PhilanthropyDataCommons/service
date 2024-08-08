INSERT INTO data_providers (
  name
) VALUES (
  :name
)
RETURNING data_provider_to_json(data_providers) AS "object";
