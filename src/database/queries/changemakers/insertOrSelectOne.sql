INSERT INTO changemakers (
	tax_id,
	name,
	keycloak_organization_id
) VALUES (
	:taxId,
	:name,
	:keycloakOrganizationId
)
ON CONFLICT (tax_id, name)
-- The no-op update is required to make RETURNING work on conflicts.
-- PostgreSQL's RETURNING clause only returns rows for DO UPDATE.
-- See: https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT
DO UPDATE SET tax_id = excluded.tax_id
RETURNING changemaker_to_json(
	changemakers,
	:authContextKeycloakUserId,
	FALSE
) AS object;
