CREATE TABLE application_outcomes (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  application_id INTEGER,
  outcome TEXT,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_application
    FOREIGN KEY(application_id)
      REFERENCES applications(id)
)
