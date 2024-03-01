CREATE TABLE organizations (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  employer_identification_number VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(employer_identification_number, name)
);

COMMENT ON TABLE organizations IS
  'Organizations that have data registered in the PDC.';
