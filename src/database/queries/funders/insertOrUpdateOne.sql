WITH
	merged_funder AS (
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
			funders AS funder,
			merge_action() = 'INSERT' AS was_inserted
	)

SELECT
	serialized_funder.object,
	merged_funder.was_inserted AS "wasInserted"
FROM merged_funder
	INNER JOIN
		build_funders_results(
			array(SELECT merged_funder.funder FROM merged_funder),
			:authContextKeycloakUserId,
			:authContextIsAdministrator
		) AS serialized_funder
		ON serialized_funder.short_code = (merged_funder.funder).short_code;
