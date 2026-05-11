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
	changemaker_to_json(
		changemakers,
		:authContextKeycloakUserId,
		FALSE
	) AS object,
	merge_action() = 'INSERT' AS "wasInserted";
