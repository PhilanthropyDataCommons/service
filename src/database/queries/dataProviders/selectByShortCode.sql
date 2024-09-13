SELECT data_provider_to_json(data_providers.*) AS "object"
FROM data_providers
WHERE short_code = :shortCode
