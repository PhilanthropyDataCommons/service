INSERT INTO data_providers (
  short_code,
  name,
  keycloak_organization_id
) VALUES (
  :shortCode,
  :name,
  :keycloakOrganizationId
)
ON CONFLICT (short_code)
DO UPDATE SET
  name = excluded.name
RETURNING data_provider_to_json(data_providers) AS object;
