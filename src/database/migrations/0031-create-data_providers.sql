CREATE TABLE data_providers (
  short_code short_code_t PRIMARY KEY,
  name VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE data_providers IS
  'Organizations that collect and process data stored by the PDC.';

INSERT INTO data_providers ( short_code, name ) VALUES ('pdc', 'The Philanthropy Data Commons' );

CREATE OR REPLACE FUNCTION system_data_provider_short_code()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'pdc';
END;
$$ LANGUAGE plpgsql;
