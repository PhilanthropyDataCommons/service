SELECT DISTINCT data_providers.id,
  data_provider_to_json(data_providers.*) AS "object"
FROM data_providers
ORDER BY data_providers.id DESC
OFFSET :offset FETCH NEXT :limit ROWS ONLY
