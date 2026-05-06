INSERT INTO changemakers (
	tax_id,
	name,
	keycloak_organization_id,
	created_by
) VALUES (
	:taxId,
	:name,
	:keycloakOrganizationId,
	:authContextKeycloakUserId
)
ON CONFLICT (tax_id, name)
-- The no-op update is required to make RETURNING work on conflicts.
-- PostgreSQL's RETURNING clause only returns rows for DO UPDATE.
-- See: https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT
DO UPDATE SET tax_id = excluded.tax_id
RETURNING jsonb_build_object(
	-- xmax is zero on a fresh INSERT and non-zero on an ON CONFLICT update,
	-- letting callers detect whether the changemaker was newly created.
	'wasInserted', xmax = 0,
	'changemaker', changemaker_to_json(
		changemakers,
		:authContextKeycloakUserId,
		FALSE
	)
) AS object;
