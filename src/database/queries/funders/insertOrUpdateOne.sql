MERGE INTO funders
USING (VALUES (
	:shortCode::short_code_t,
	:name::varchar,
	:keycloakOrganizationId::uuid,
	:isCollaborative::boolean,
	:defaultTerminologySetId::int,
	:authContextKeycloakUserId::uuid
)) AS source (
	short_code,
	name,
	keycloak_organization_id,
	is_collaborative,
	default_terminology_set_id,
	created_by
)
ON funders.short_code = source.short_code
WHEN MATCHED THEN UPDATE SET
	name = source.name,
	keycloak_organization_id = source.keycloak_organization_id,
	is_collaborative = source.is_collaborative,
	default_terminology_set_id = source.default_terminology_set_id
WHEN NOT MATCHED THEN INSERT (
	short_code,
	name,
	keycloak_organization_id,
	is_collaborative,
	default_terminology_set_id,
	created_by
) VALUES (
	source.short_code,
	source.name,
	source.keycloak_organization_id,
	source.is_collaborative,
	source.default_terminology_set_id,
	source.created_by
)
RETURNING
	funder_to_json(funders) AS object,
	merge_action() = 'INSERT' AS "wasInserted";
