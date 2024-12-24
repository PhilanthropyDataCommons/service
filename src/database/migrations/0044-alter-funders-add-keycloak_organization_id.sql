ALTER TABLE funders
  ADD COLUMN keycloak_organization_id uuid UNIQUE;
