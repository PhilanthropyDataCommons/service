CREATE TYPE source_type AS ENUM ('data_provider', 'funder', 'organization', 'system');

CREATE TABLE sources (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  source_type source_type NOT NULL,
  label VARCHAR NOT NULL,
  organization_id INTEGER REFERENCES organizations(id),
  funder_id INTEGER REFERENCES funders(id),
  data_provider_id INTEGER REFERENCES data_providers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, funder_id, data_provider_id),
  CONSTRAINT chk_proper_fk CHECK (
    (source_type = 'data_provider'
      AND data_provider_id IS NOT NULL
      AND funder_id IS NULL
      AND organization_id IS NULL) OR
    (source_type = 'funder'
      AND data_provider_id IS NULL
      AND funder_id IS NOT NULL
      AND organization_id IS NULL) OR
    (source_type = 'organization'
      AND data_provider_id IS NULL
      AND funder_id IS NULL
      AND organization_id IS NOT NULL ) OR
    (source_type = 'system'
      AND data_provider_id IS NULL
      AND funder_id IS NULL
      AND organization_id IS NULL)
  )
);

COMMENT ON TABLE sources IS
  'Sources of data in the PDC, along with a reference to the entity representing that source in the PDC.';
