CREATE TABLE external_field_values (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  external_source_id INTEGER,
  canonical_field_id INTEGER,
  label TEXT,
  field_value TEXT,
  position INTEGER,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_external_source
    FOREIGN KEY(external_source_id)
      REFERENCES external_sources(id),
  CONSTRAINT fk_canonical_field
    FOREIGN KEY(canonical_field_id)
      REFERENCES canonical_fields(id)
)
