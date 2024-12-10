ALTER TABLE data_providers
  ADD COLUMN keycloak_organization_id UUID UNIQUE;
