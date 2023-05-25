SELECT
  external_id AS "externalId",
  platform_provider AS "platformProvider",
  data,
  created_at AS "createdAt"
FROM platform_provider_responses
WHERE external_id = :externalId
ORDER BY created_at DESC;
