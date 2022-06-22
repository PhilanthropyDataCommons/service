CREATE TABLE application_schemas (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id INTEGER,
  version INTEGER,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_opportunity
    FOREIGN KEY(opportunity_id)
      REFERENCES opportunities(id),
  UNIQUE(opportunity_id, version)
)
