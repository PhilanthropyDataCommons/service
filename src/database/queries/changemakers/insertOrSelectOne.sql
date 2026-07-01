WITH
	merged_changemaker AS (
		MERGE INTO changemakers
		USING (VALUES (
			:taxId::varchar,
			:name::varchar,
			:keycloakOrganizationId::uuid,
			:authContextKeycloakUserId::uuid
		)) AS source (
			tax_id,
			name,
			keycloak_organization_id,
			created_by
		)
		ON
			changemakers.tax_id = source.tax_id
			AND changemakers.name = source.name
		-- No-op SET so RETURNING fires for existing rows (insertOrSelect semantics).
		WHEN MATCHED THEN UPDATE SET tax_id = source.tax_id
		WHEN NOT MATCHED THEN INSERT (
			tax_id,
			name,
			keycloak_organization_id,
			created_by
		) VALUES (
			source.tax_id,
			source.name,
			source.keycloak_organization_id,
			source.created_by
		)
		RETURNING
			changemakers AS changemaker,
			merge_action() = 'INSERT' AS was_inserted
	)

SELECT
	serialized_changemaker.object,
	merged_changemaker.was_inserted AS "wasInserted"
FROM merged_changemaker
	INNER JOIN
		build_changemakers_results(
			array(SELECT merged_changemaker.changemaker FROM merged_changemaker),
			:authContextKeycloakUserId,
			FALSE
		) AS serialized_changemaker
		ON serialized_changemaker.id = (merged_changemaker.changemaker).id;
