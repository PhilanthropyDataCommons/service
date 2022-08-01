CREATE TABLE application_schema_fields (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  application_schema_id INTEGER NOT NULL
    REFERENCES application_schemas (id) ON DELETE CASCADE,
  canonical_field_id INTEGER NOT NULL
    REFERENCES canonical_fields (id) ON DELETE CASCADE,
  position INT NOT NULL,
  label VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_application_schema_id_canonical_field_id UNIQUE(application_schema_id, canonical_field_id)
);

COMMENT ON TABLE application_schema_fields IS
  'An available field in an application schema.';
COMMENT ON COLUMN application_schema_fields.position IS
  'The relative order of this field within its application schema.';
COMMENT ON COLUMN application_schema_fields.label IS
  'The name of this field within its application schema. These may vary between application schemas, opportunities, or organizations but many of these may refer to one canonical field.';
