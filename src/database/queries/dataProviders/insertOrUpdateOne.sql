MERGE INTO data_providers
USING (VALUES (
	:shortCode::short_code_t,
	:name::varchar,
	:keycloakOrganizationId::uuid,
	:authContextKeycloakUserId::uuid
)) AS source (
	short_code,
	name,
	keycloak_organization_id,
	created_by
)
ON data_providers.short_code = source.short_code
WHEN MATCHED THEN UPDATE SET
	name = source.name,
	keycloak_organization_id = source.keycloak_organization_id
WHEN NOT MATCHED THEN INSERT (
	short_code,
	name,
	keycloak_organization_id,
	created_by
) VALUES (
	source.short_code,
	source.name,
	source.keycloak_organization_id,
	source.created_by
)
RETURNING
	data_provider_to_json(data_providers) AS object,
	merge_action() = 'INSERT' AS "wasInserted";
