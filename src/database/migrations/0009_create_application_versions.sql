CREATE TABLE application_versions (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  application_id INTEGER,
  version INTEGER,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_application
    FOREIGN KEY(application_id)
      REFERENCES applications(id),
  UNIQUE(application_id, version)
)
