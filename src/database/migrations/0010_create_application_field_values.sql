CREATE TABLE application_field_values (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  application_version_id INTEGER,
  application_schema_field_id INTEGER,
  position INTEGER,
  field_value TEXT,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_application_version
    FOREIGN KEY(application_version_id)
      REFERENCES application_versions(id),
  CONSTRAINT fk_application_schema_field
    FOREIGN KEY(application_schema_field_id)
      REFERENCES application_schema_fields(id)
)
