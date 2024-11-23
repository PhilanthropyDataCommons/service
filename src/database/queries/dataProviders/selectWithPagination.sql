SELECT data_provider_to_json(data_providers.*) AS object
FROM data_providers
ORDER BY data_providers.created_at DESC
LIMIT :limit OFFSET :offset;
