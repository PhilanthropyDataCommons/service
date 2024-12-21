INSERT INTO platform_provider_responses (
	external_id,
	platform_provider,
	data
)
VALUES (
	:externalId,
	:platformProvider,
	:data
)
ON CONFLICT (external_id, platform_provider) DO UPDATE
SET
data = excluded.data,
created_at = excluded.created_at
RETURNING
	external_id AS "externalId",
	platform_provider AS "platformProvider",
	data,
	created_at AS "createdAt";
