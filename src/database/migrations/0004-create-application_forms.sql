CREATE TABLE application_forms (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_opportunity
    FOREIGN KEY(opportunity_id)
      REFERENCES opportunities(id),
  UNIQUE(opportunity_id, version)
);

COMMENT ON TABLE application_forms IS
  'A version of the set of questions collected from applicants for a given opportunity.';
