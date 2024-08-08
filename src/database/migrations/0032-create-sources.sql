CREATE TABLE sources (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  label VARCHAR NOT NULL,
  organization_id INTEGER REFERENCES organizations(id),
  funder_short_code VARCHAR REFERENCES funders(short_code),
  data_provider_short_code VARCHAR REFERENCES data_providers(short_code),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_one_fk CHECK (
    num_nonnulls(organization_id, funder_short_code, data_provider_short_code) = 1
  )
);

COMMENT ON TABLE sources IS
  'Sources of data in the PDC, along with a reference to the entity representing that source in the PDC.';

INSERT INTO sources ( label, data_provider_short_code ) VALUES ('The Philanthropy Data Commons', system_data_provider_short_code());

CREATE OR REPLACE FUNCTION system_source_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN 1;
END;
$$ LANGUAGE plpgsql;
