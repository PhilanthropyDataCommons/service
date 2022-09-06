CREATE TABLE applicants (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  external_id VARCHAR NOT NULL,
  opted_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(external_id)
);

COMMENT ON TABLE applicants IS
  'Individuals or organizations that might have data registered in the PDC.';
COMMENT ON COLUMN applicants.external_id IS
  'A unique external identifier for the entity, such as a Tax ID Number.';
COMMENT ON COLUMN applicants.opted_in IS
  'A flag to indicate whether the applicant has explicitly opted into participation in the PDC.';
