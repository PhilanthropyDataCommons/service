CREATE TABLE application_schema_fields (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  application_schema_id INTEGER,
  canonical_field_id INTEGER,
  position INTEGER,
  label TEXT,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_application_schema
    FOREIGN KEY(application_schema_id)
      REFERENCES application_schemas(id),
  CONSTRAINT fk_canonical_field
    FOREIGN KEY(canonical_field_id)
      REFERENCES canonical_fields(id)
)
